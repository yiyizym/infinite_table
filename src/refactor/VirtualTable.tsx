import React from "react";
import {
    Fixed,
    PropsType,
    ReComputeType,
    StoreType,
    RowLoadStatus,
    VirtualTableProps,
    VirtualTableState
} from "@/refactor/interfaces";
import {getFixedType, updateWrapStyle} from "@/refactor/helper";
import Store, {getCurrentID} from "@/refactor/store";
import {C} from "./context";


class VirtualTable extends React.Component<VirtualTableProps, VirtualTableState> {
    private inst: React.RefObject<HTMLTableElement>;
    private wrapInst: React.RefObject<HTMLDivElement>;

    private scrollTop: number;
    private scrollLeft: number;

    private fixed: Fixed;

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
        this.fixed = getFixedType(props as PropsType);

        if(this.fixed === Fixed.NO) {
            const store = Store.get(getCurrentID()) as StoreType;
            store.rowLoadStatus = RowLoadStatus.INIT
        }
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

    public componentDidMount() {
        switch (this.fixed) {
            case Fixed.LEFT:
                Store.get(0 - getCurrentID())!.wrapInst = this.wrapInst;
                break;
            case Fixed.RIGHT:
                Store.get(1 << 31 + getCurrentID())!.wrapInst = this.wrapInst;
                break;
            default:
                this.wrapInst.current!.parentElement!.onscroll = this.scrollHook;
                let store = Store.get(getCurrentID()) as StoreType
                store.wrapInst = this.wrapInst;
                store.reComputeCount = ReComputeType.NOT_CHANGED
                updateWrapStyle(store.wrapInst.current as HTMLDivElement, store.computedTbodyHeight)
        }
    }

    private scrollHook = () => {

    }
}

export default VirtualTable
