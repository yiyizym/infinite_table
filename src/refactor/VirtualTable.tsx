import React from "react";
import {
    consolidatedEventType,
    Fixed, FixedStoreType,
    RowLoadStatus,
    ScrollEvent,
    ScrollHookOpts,
    StoreType,
    VirtualTableProps,
    VirtualTableState
} from "./interfaces";
import {calculatePositions, getFixedType, log, scrollTo, updateWrapStyle} from "./helper";
import Store, {getCurrentID} from "./store";
import {C} from "./context";


class VirtualTable extends React.Component<VirtualTableProps, VirtualTableState> {
    private readonly inst: React.RefObject<HTMLTableElement>;
    private readonly wrapInst: React.RefObject<HTMLDivElement>;

    private scrollTop: number;
    private scrollLeft: number;

    private readonly fixed: Fixed;

    private consolidatedEvent: consolidatedEventType;

    private readonly delayedEvents: Array<ScrollHookOpts | Event>;

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
        };
        this.delayedEvents = [];
        this.consolidatedEvent = {top: 0, left: 0, flag: ScrollEvent.NULL};
        this.throttling = false;
        this.setStateLocked = false;

        this.fixed = getFixedType(props);

        log('init VirtualTable:', this);

        this.initStore();

    }

    private initStore = (): void => {
        if (this.fixed === Fixed.NO) {
            const store = Store.get(getCurrentID()) as StoreType;
            store.rowLoadStatus = RowLoadStatus.INIT;
            store.possibleRowHeight = -1;
            store.computedTbodyHeight = 0;
            store.reComputeCount = 0;
        } else if(this.fixed === Fixed.LEFT) {
            Store.set(0 - getCurrentID(), { leftPointer: this } as unknown as FixedStoreType);
        } else if(this.fixed === Fixed.RIGHT) {
            Store.set((1 << 31) + getCurrentID(), { rightPointer: this } as unknown as FixedStoreType);
        }
    };

    public render(): JSX.Element {
        const { head, tail, top } = this.state;
        const { style, children, ...rest } = this.props;

        const {width, ...restStyle} = style;

        return (<div
            ref={this.wrapInst}
            style={{width, position: 'relative', transform: "matrix(1, 0, 0, 1, 0, 0)"}}
        >
            <table
                {...rest}
                ref={this.inst}
                style={{
                    ...restStyle,
                    position: 'absolute',
                    top
                }}
            >
                <C.Provider value={{tail, head, fixed: this.fixed}}>
                    {children}
                </C.Provider>
            </table>
        </div>)
    }

    public componentDidMount(): void {
        log('VirtualTable componentDidMount');
        let store = Store.get(getCurrentID()) as StoreType;
        switch (this.fixed) {
            case Fixed.LEFT:
                const leftFixedStore = Store.get(0 - getCurrentID()) as FixedStoreType;
                leftFixedStore!.wrapInst = this.wrapInst;
                break;
            case Fixed.RIGHT:
                const rightFixedStore = Store.get(1 << 31 + getCurrentID()) as FixedStoreType;
                rightFixedStore!.wrapInst = this.wrapInst;
                break;
            default:
                this.wrapInst.current!.parentElement!.onscroll = this.scrollHook;
                store.wrapInst = this.wrapInst;
                store.reComputeCount = 0;
        }
        updateWrapStyle(this.wrapInst.current as HTMLDivElement, store.computedTbodyHeight);

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
        const store = Store.get(getCurrentID()) as StoreType;
        if(this.fixed === Fixed.LEFT) {
            const leftStore = Store.get(0 - getCurrentID()) as StoreType;
            return updateWrapStyle(leftStore.wrapInst.current!, store.computedTbodyHeight);
        } else if(this.fixed === Fixed.RIGHT) {
            const rightStore = Store.get(0 - getCurrentID()) as StoreType;
            return updateWrapStyle(rightStore.wrapInst.current!, store.computedTbodyHeight);
        }
        updateWrapStyle(store.wrapInst.current!, store.computedTbodyHeight);

        if(store.rowLoadStatus === RowLoadStatus.INIT) { return; }

        if(store.rowLoadStatus === RowLoadStatus.LOADED) {
            store.rowLoadStatus = RowLoadStatus.RUNNING;
            this.scrollHook({
                target: { scrollTop: 0, scrollLeft: 0 },
                flag: ScrollEvent.INIT
            })
        }

        if(store.rowLoadStatus === RowLoadStatus.RUNNING) {
            if(store.reComputeCount !== 0) {
                store.reComputeCount = 0; // TODO why
                this.scrollHook({
                    target: { scrollTop: this.scrollTop, scrollLeft: this.scrollLeft },
                    flag: ScrollEvent.RECOMPUTE
                })
            }
        }

    }

    public componentWillUnmount(): void {
        Store.delete(getCurrentID());
        Store.delete(0 - getCurrentID());
        Store.delete((1 << 31) + getCurrentID());
    }

    private scrollHook = (opts: ScrollHookOpts | Event | null) => {
        let skip = 0;
        const delayedEvents = this.delayedEvents;
        if(opts) {
            if(!(opts instanceof Event) && opts.flag) {
                for (let i = 0; i < delayedEvents.length; ++i) {
                    const delayedEvent = delayedEvents[i];
                    if(delayedEvent instanceof Event) { continue }
                    if(!(delayedEvents[i] instanceof Event) && opts.flag === delayedEvent.flag) { return; } // 阻止再次触发已经在队列中的事件
                    if(!skip && (delayedEvent.flag & ScrollEvent.MASK)) { skip = 1 } // 如果 flag 是 INIT/RECOMPUTE/RESTORE 其中一种就 skip
                }
            }
            delayedEvents.push(opts);
            if(skip) { return; }
        }

        if(this.throttling) return;
        if(this.setStateLocked) return;
        if(delayedEvents.length === 0) return;
        this.throttling = true;

        setTimeout(() => {
            let flag = ScrollEvent.NULL;
            let delayedEventLength = this.delayedEvents.length;
            while(delayedEventLength--) {
                const delayedEvent = this.delayedEvents.shift() as (ScrollHookOpts | Event);
                if(!(delayedEvent instanceof Event)) {
                    flag |= delayedEvent.flag;
                } else {
                    flag |= ScrollEvent.NATIVE;
                }

                this.consolidatedEvent.top = (delayedEvent as ScrollHookOpts).target.scrollTop; // 原生scroll事件的 target 其实是有 scrollTop 的，但是 ts 和 react 的类型没有
                this.consolidatedEvent.left = (delayedEvent as ScrollHookOpts).target.scrollLeft;

                if(flag & ScrollEvent.MASK) break; // 如果 flag 是 INIT/RECOMPUTE/RESTORE 其中一种就跳出
            }
            this.consolidatedEvent.flag |= flag;
            if(this.consolidatedEvent.flag !== ScrollEvent.NULL) {
                requestAnimationFrame(this.update);
            }
        }, 20)
    };

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
                scrollTo(0, 0);
                flag &= ~ScrollEvent.INIT; // 将 flag 中 INIT 所处比特位（第 1 位）重置为 0
                this.consolidatedEvent.flag &= flag; // 相当于直接赋值

                if(this.delayedEvents.length) { this.scrollHook(null) }
            });

            const leftFixedStore = Store.get(0 - getCurrentID()), rightFixedStore = Store.get(1 << 31 + getCurrentID());
            if(leftFixedStore) leftFixedStore.leftPointer!.setState({ head, tail, top });
            if(rightFixedStore) rightFixedStore.rightPointer!.setState({ head, tail, top });
            return;
        }

        if(flag & ScrollEvent.RECOMPUTE) {
            if(head === prevHead && tail === prevTail && top === prevTop) {
                flag &= ~ScrollEvent.RECOMPUTE;
                this.consolidatedEvent.flag &= flag; // 相当于直接赋值
                if(this.delayedEvents.length) { this.scrollHook(null) }
                return;
            }
            this.setStateLocked = true;
            this.setState({head, tail, top}, () => {
                this.setStateLocked = false;
                scrollTo(scrollTop, scrollLeft);
                flag &= ~ScrollEvent.RECOMPUTE;
                this.consolidatedEvent.flag &= flag; // 相当于直接赋值
                if(this.delayedEvents.length) { this.scrollHook(null) }
            });
            return;
        }

        if(flag & ScrollEvent.NATIVE) {
            if(head === prevHead && tail === prevTail && top === prevTop) {
                flag &= ~ScrollEvent.NATIVE;
                this.consolidatedEvent.flag &= flag; // 相当于直接赋值
                if(this.delayedEvents.length) { this.scrollHook(null) }
                return;
            }
            this.scrollTop = scrollTop;
            this.scrollLeft = scrollLeft;
            this.setStateLocked = true;
            this.setState({head, tail, top}, () => {
                this.setStateLocked = false;
                flag &= ~ScrollEvent.NATIVE;
                this.consolidatedEvent.flag &= flag; // 相当于直接赋值
                if(this.delayedEvents.length) { this.scrollHook(null) }
            });

            const leftFixedStore = Store.get(0 - getCurrentID()), rightFixedStore = Store.get(1 << 31 + getCurrentID());
            if(leftFixedStore) leftFixedStore.leftPointer!.setState({ head, tail, top });
            if(rightFixedStore) rightFixedStore.rightPointer!.setState({ head, tail, top });
            return;

        }
    }

}

export default VirtualTable
