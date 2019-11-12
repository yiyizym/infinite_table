import React from "react";
import {
    consolidatedEventType,
    Fixed,
    RowLoadStatus,
    ScrollEvent,
    ScrollHookOpts,
    StoreType,
    VirtualTableProps,
    VirtualTableState
} from "@/refactor/interfaces";
import {calculatePositions, getFixedType, updateWrapStyle, scrollTo} from "@/refactor/helper";
import Store, {getCurrentID} from "@/refactor/store";
import {C} from "./context";


class VirtualTable extends React.Component<VirtualTableProps, VirtualTableState> {
    private inst: React.RefObject<HTMLTableElement>;
    private wrapInst: React.RefObject<HTMLDivElement>;

    private scrollTop: number;
    private scrollLeft: number;

    private fixed: Fixed;

    private consolidatedEvent: consolidatedEventType;

    private delayedEvents: Array<ScrollHookOpts | Event>;

    private throttling: boolean;
    private setStateLocked: boolean;

    public constructor(props: VirtualTableProps) {
        super(props);
        this.inst = React.createRef();
        this.wrapInst = React.createRef();
        this.scrollTop = 0;
        this.scrollLeft = 0;
        this.state = {
            top: 0,
            head: 0,
            tail: 1
        }
        this.fixed = getFixedType(props);

        if (this.fixed === Fixed.NO) {
            const store = Store.get(getCurrentID()) as StoreType;
            store.rowLoadStatus = RowLoadStatus.INIT
        }

        this.delayedEvents = [];
        this.consolidatedEvent = {top: 0, left: 0, flag: ScrollEvent.NULL};
        this.throttling = false;
        this.setStateLocked = false;
    }

    public render(): JSX.Element {
        const { head, tail, top } = this.state;
        const { style, children, ...rest } = this.props;
        style.position = 'absolute';
        style.top = top;


        return (<div
            ref={this.wrapInst}
            style={{position: 'relative'}}
        >
            <table
                {...rest}
                ref={this.inst}
                style={style}
            >
                <C.Provider value={{tail, head, fixed: this.fixed}}>
                    {children}
                </C.Provider>
            </table>
        </div>)
    }

    public componentDidMount(): void {
        let store = Store.get(getCurrentID()) as StoreType;
        switch (this.fixed) {
            case Fixed.LEFT:
                Store.get(0 - getCurrentID())!.wrapInst = this.wrapInst;
                break;
            case Fixed.RIGHT:
                Store.get(1 << 31 + getCurrentID())!.wrapInst = this.wrapInst;
                break;
            default:
                this.wrapInst.current!.parentElement!.onscroll = this.scrollHook;
                store.wrapInst = this.wrapInst;
                store.reComputeCount = 0;
                updateWrapStyle(store.wrapInst.current as HTMLDivElement, store.computedTbodyHeight);
        }

        if(this.props.children[2].props.children.length === 0) { return; } // TODO figure out this
        store.rowLoadStatus = RowLoadStatus.RUNNING;

        if(this.consolidatedEvent.flag === ScrollEvent.RESTORE) {
            this.scrollHook({
                target: { scrollTop: this.scrollTop, scrollLeft: this.scrollLeft },
                flag: ScrollEvent.NULL
            })
        } else {
            this.scrollHook({
                target: { scrollTop: 0, scrollLeft: 0 },
                flag: ScrollEvent.INIT
            })
        }
    }

    public componentDidUpdate(): void {

    }

    private scrollHook = (opts: ScrollHookOpts | Event | null) => {
        let skip = 0;
        const delayedEvents = this.delayedEvents;
        if(opts) {
            if(!(opts instanceof Event) && opts.flag) {
                for (let i = 0; i < delayedEvents.length; ++i) {
                    const delayedEvent = delayedEvents[i]
                    if(delayedEvent instanceof Event) { continue }
                    if(!(delayedEvents[i] instanceof Event) && opts.flag === delayedEvent.flag) { return; } // 阻止再次触发已经在队列中的事件
                    if(!skip && delayedEvent.flag & ScrollEvent.MASK) { skip = 1 } // 如果 flag 是 INIT/RECOMPUTE/RESTORE 其中一种就 skip
                }
            }
            delayedEvents.push(opts);
            if(skip) { return; }
        }

        if(this.throttling) return;
        this.throttling = true;

        setTimeout(() => {
            let flag = ScrollEvent.NULL;
            let delayedEventLength = this.delayedEvents.length;
            while(delayedEventLength--) {
                const delayedEvent = this.delayedEvents.shift() as (ScrollHookOpts | Event);
                if(delayedEvent instanceof Event) {
                    flag = ScrollEvent.NATIVE;
                } else {
                    flag = delayedEvent.flag;
                }

                this.consolidatedEvent.top = (delayedEvent as ScrollHookOpts).target.scrollTop; // 这里没有特意处理 原生事件
                this.consolidatedEvent.left = (delayedEvent as ScrollHookOpts).target.scrollLeft; // 这里没有特意处理 原生事件

                if(flag & ScrollEvent.MASK) break;
            }
            this.consolidatedEvent.flag |= flag;
            if(this.consolidatedEvent.flag & ScrollEvent.MASK) {
                this.consolidatedEvent.flag |= ScrollEvent.BARRIER;
            }
            if(this.consolidatedEvent.flag !== ScrollEvent.NULL) {
                requestAnimationFrame(this.update);
            }
        }, 20)
    }

    private update = (timeStamp: number): void => {
        cancelAnimationFrame(timeStamp);
        this.throttling = false;

        const scrollTop = this.consolidatedEvent.top;
        const scrollLeft = this.consolidatedEvent.left;
        let flag = this.consolidatedEvent.flag;

        const [head, tail, top] = calculatePositions(scrollTop);

        const { head: prevHead, tail: prevTail, top: prevTop } = this.state;

        if(flag & ScrollEvent.INIT) {
            console.assert(scrollTop === 0 && scrollLeft === 0);
            this.setStateLocked = true;
            this.setState({head, tail, top}, () => {
                this.setStateLocked = false;
                scrollTo(0, 0)
                flag &= ~ScrollEvent.INIT; // 将 flag 中 INIT 所处比特位（第 1 位）重置为 0
                flag &= ~ScrollEvent.BARRIER; // 类似上面
                this.consolidatedEvent.flag &= flag // 相当于直接赋值

                if(this.delayedEvents.length) { this.scrollHook(null) }
            })

            const leftFixedStore = Store.get(0 - getCurrentID()), rightFixedStore = Store.get(1 << 31 + getCurrentID());
            if(leftFixedStore) leftFixedStore.leftPointer.setState({ head, tail, top });
            if(rightFixedStore) rightFixedStore.rightPointer.setState({ head, tail, top });
            return;
        }

        if(flag & ScrollEvent.RECOMPUTE) {
            if(head === prevHead && tail === prevTail && top === prevTop) {
                flag &= ~ScrollEvent.RECOMPUTE;
                flag &= ~ScrollEvent.BARRIER;
                this.consolidatedEvent.flag &= flag // 相当于直接赋值
                if(this.delayedEvents.length) { this.scrollHook(null) }
                return;
            }
            this.setStateLocked = true;
            this.setState({head, tail, top}, () => {
                this.setStateLocked = false;
                scrollTo(scrollTop, scrollLeft);
                flag &= ~ScrollEvent.RECOMPUTE;
                flag &= ~ScrollEvent.BARRIER;
                this.consolidatedEvent.flag &= flag // 相当于直接赋值
                if(this.delayedEvents.length) { this.scrollHook(null) }
            })
            return;
        }

        if(flag & ScrollEvent.RESTORE) {}

        if(flag & ScrollEvent.NATIVE) {
            if(head === prevHead && tail === prevTail && top === prevTop) {
                flag &= ~ScrollEvent.NATIVE;
                this.consolidatedEvent.flag &= flag // 相当于直接赋值
                if(this.delayedEvents.length) { this.scrollHook(null) }
                return;
            }
            this.scrollTop = scrollTop;
            this.scrollLeft = scrollLeft;
            this.setStateLocked = true;
            this.setState({head, tail, top}, () => {
                this.setStateLocked = false;
                flag &= ~ScrollEvent.NATIVE;
                this.consolidatedEvent.flag &= flag // 相当于直接赋值
                if(this.delayedEvents.length) { this.scrollHook(null) }
            })

            const leftFixedStore = Store.get(0 - getCurrentID()), rightFixedStore = Store.get(1 << 31 + getCurrentID());
            if(leftFixedStore) leftFixedStore.leftPointer.setState({ head, tail, top });
            if(rightFixedStore) rightFixedStore.rightPointer.setState({ head, tail, top });
            return;

        }
    }

}

export default VirtualTable
