import React from 'react'
import {Fixed, VirtualTableRowProps} from './interfaces'
import {C} from './context'
import {recordRowHeight} from './helper'

class VirtualTableRow extends React.Component<VirtualTableRowProps> {

  private readonly inst: React.RefObject<HTMLTableRowElement>;
  private fixed: Fixed;

  public constructor(props: VirtualTableRowProps) {
    super(props)
    this.inst = React.createRef()
    this.fixed = Fixed.UNKNOWN
  }

  public render(): JSX.Element {
    const { children, ...restProps } = this.props

    return (
      <C.Consumer>
        {
          ({ fixed }) => {
            if (this.fixed === Fixed.UNKNOWN) { this.fixed = fixed}
            return <tr {...restProps} ref={this.inst}>{children}</tr>
          }
        }
      </C.Consumer>
    )
  }

  public componentDidMount(): void {
    // console.log('VirtualTableRow mounted : ', this.fixed)
    if (this.fixed !== Fixed.NO || !this.inst.current) {return}
    recordRowHeight(Number(this.props['data-row-key']), this.inst.current)
  }

  public componentDidUpdate(): void {
    if (this.fixed !== Fixed.NO || !this.inst.current) {return}
    recordRowHeight(Number(this.props['data-row-key']), this.inst.current)
  }


}

export default VirtualTableRow
