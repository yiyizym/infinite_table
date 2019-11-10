import React from "react";
import {Fixed, PropsType, Store, VirtualTableContext, VirtualTableProps, VirtualTableState} from "@/refactor/interfaces";
import {getFixedType} from "@/refactor/helper";



const C = React.createContext<VirtualTableContext>({head: 0, tail: 0, fixed: Fixed.UNKNOWN});

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
        this.fixed = getFixedType(props as PropsType)

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
                <C.Provider value={{ tail, head, fixed: this.fixed }}>
                    {children}
                </C.Provider>
            </table>
        </div>)
    }

    public componentDidMount() {
        switch (this.fixed) {
            case Fixed.LEFT:
            case Fixed.RIGHT:
                break;
            default:
                // this.wrapInst.current!.parentElement!.onscroll = this.scrollHook;

        }
    }
}

export default VirtualTable
