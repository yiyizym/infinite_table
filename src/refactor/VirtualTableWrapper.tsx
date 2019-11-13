import React from "react";
import {Fixed, VirtualTableWrapperProps} from "./interfaces";
import {C} from "./context";
import {predicateTbodyHeight, setActualRowCount} from "./helper";

class VirtualTableWrapper extends React.Component<VirtualTableWrapperProps> {
    private actualRowCount: number;
    private fixed: Fixed;

    public constructor(props: VirtualTableWrapperProps) {
        super(props);
        this.actualRowCount = 0;
        this.fixed = Fixed.UNKNOWN;
    }

    public render(): JSX.Element {
        const { children, ...restProps } = this.props;
        return (
            <C.Consumer>
                {
                    ({ head, tail, fixed }) => {
                        if(this.fixed === Fixed.UNKNOWN) { this.fixed = fixed; }
                        this.actualRowCount = children.length;
                        setActualRowCount(this.actualRowCount);
                        return <tbody {...restProps}>{children.slice(head, tail)}</tbody>
                    }
                }
            </C.Consumer>
        )
    }

    public componentDidMount(): void {
        if(this.fixed !== Fixed.NO) return;
        predicateTbodyHeight()
    }

    public componentDidUpdate(): void {
        if(this.fixed !== Fixed.NO) return;
        predicateTbodyHeight()
    }
}

export default VirtualTableWrapper;
