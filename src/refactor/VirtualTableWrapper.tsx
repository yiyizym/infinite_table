import React from "react";
import {Fixed, VirtualTableWrapperProps} from "./interfaces";
import {C} from "./context";
import {upateRowAndbodyHeight, setActualRowCount} from "./helper";

class VirtualTableWrapper extends React.Component<VirtualTableWrapperProps> {
    private actualRowCount: number;
    private fixed: Fixed;
    private readonly inst: React.RefObject<HTMLTableSectionElement>;

    public constructor(props: VirtualTableWrapperProps) {
        super(props);
        this.actualRowCount = 0;
        this.fixed = Fixed.UNKNOWN;
        this.inst = React.createRef();
    }

    public render(): JSX.Element {
        const { children, ...restProps } = this.props;
        return (
            <C.Consumer>
                {
                    ({ head, tail, fixed }) => {
                        if(this.fixed === Fixed.UNKNOWN) { this.fixed = fixed; }
                        if(this.actualRowCount !== children.length && (fixed === Fixed.NO)) {
                            setActualRowCount(children.length);
                            this.actualRowCount = children.length;
                        }
                        return <tbody {...restProps} ref={this.inst}>{children.slice(head, tail)}</tbody>
                    }
                }
            </C.Consumer>
        )
    }

    public componentDidMount(): void {
        if(this.fixed !== Fixed.NO) return;
        upateRowAndbodyHeight(this.inst)
    }

    public componentDidUpdate(): void {
        if(this.fixed !== Fixed.NO) return;
        upateRowAndbodyHeight(this.inst)
    }
}

export default VirtualTableWrapper;
