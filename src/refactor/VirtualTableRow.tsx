import React from "react";
import {Fixed, StoreType, RowLoadStatus, VirtualTableRowProps} from "./interfaces";
import {C} from "./context";
import {updateTbodyAndRowHeight} from "./helper";
import Store, {getCurrentID} from "./store";

class VirtualTableRow extends React.Component<VirtualTableRowProps> {

    private readonly inst: React.RefObject<HTMLTableRowElement>;
    private fixed: Fixed;

    public constructor(props: VirtualTableRowProps) {
        super(props);
        this.inst = React.createRef();
        this.fixed = Fixed.UNKNOWN;
    }

    public render(): JSX.Element {
        const { children, ...restProps } = this.props;

        return (
            <C.Consumer>
                {
                    ({ fixed }) => {
                        if(this.fixed === Fixed.UNKNOWN) { this.fixed = fixed;}
                        return <tr {...restProps} ref={this.inst}>{children}</tr>;
                    }
                }
            </C.Consumer>
        )
    }

    public componentDidMount():void {
        if(this.fixed !== Fixed.NO) return;
        updateTbodyAndRowHeight(this.props.children[0].props.index, this.inst);
        const store = Store.get(getCurrentID()) as StoreType;
        if(store.rowLoadStatus === RowLoadStatus.INIT) { store.rowLoadStatus = RowLoadStatus.LOADED; }
    }

    public componentDidUpdate():void {
        if(this.fixed !== Fixed.NO) return;
        updateTbodyAndRowHeight(this.props.children[0].props.index, this.inst)
    }


}

export default VirtualTableRow
