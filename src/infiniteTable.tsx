import React from 'react'
import { Table } from 'antd'
import { TableProps } from 'antd/lib/table'
import { debounce } from 'lodash'
import LoadingPic from './loading.svg'


interface InfiniteTableProps<T> extends TableProps<T> {
  itemHeight: number;
  total: number;
}

interface InfiniteTableState {
  startIndex: number;
  endIndex: number;
}

const pageSize = 50
const preTableItem = 20

let tableTop: { fixed: number; main: number } = { fixed: 0, main: 0}
let ticking = false
let formerStartIndex = 0
let formerEndIndex = 0

const isFixedTable = (style: React.CSSProperties): boolean => {
  return !('width' in style)
}

const getCustomTable = (itemHeight: number, total: number, instance: React.Component): React.ComponentClass<{style: React.CSSProperties}> => {
  class CustomTable extends React.Component<{style: React.CSSProperties}> {
    private infiniteTableInstance = instance
    private tableRef = React.createRef<HTMLTableElement>()

    // table 的绝对定位
    private calculateTableTop = (scrollTop: number): {fixed: number; main: number} => {
      let margin = (scrollTop / itemHeight % 1) * itemHeight
      let tableTop = Math.max(scrollTop - preTableItem * itemHeight - margin, 0)
      let fixedTableTop = tableTop ? preTableItem * itemHeight + margin : 0
      return {
        fixed: fixedTableTop,
        main: tableTop
      }
    }

    private reposition(): void {
      if (!this.tableRef.current) {
        ticking = false
        return
      }
      const table = this.tableRef.current as HTMLTableElement
      const containerScrollTop = (table.parentElement as HTMLTableElement).scrollTop
      console.log('containerScrollTop ', containerScrollTop)
      // itemHeight tr 的高度
      // currentTableTrIndexInView 当前刚好能看得到的 tr 的 Index:  currentTableTrIndexInView = Math.ceil(scrollTop / itemHeight)
      const currentTableTrIndexInView = Math.floor(containerScrollTop / itemHeight)
      // console.log('currentTableTrIndexInView ', currentTableTrIndexInView)
      // startIndex dataSource 的切片开始值，currentTableTrIndexInView 往前推 preTableItem 个
      const startIndex = Math.max(currentTableTrIndexInView - preTableItem, 0)
      // console.log('startIndex ', startIndex)
      // endIndex dataSource 的切片结束值，currentTableTrIndexInView 往后推 sufTableItem 个
      const endIndex = startIndex + pageSize - 1
      // console.log('endIndex ', endIndex)

      tableTop = this.calculateTableTop(containerScrollTop)
      // console.log('newTableTop ', tableTop)
      if (formerStartIndex === startIndex && formerEndIndex === endIndex) {
        ticking = false
        return
      }
      this.infiniteTableInstance.setState({
        startIndex,
        endIndex,
      }, (): void => {
        formerStartIndex = startIndex
        formerEndIndex = endIndex
        ticking = false
      })
    }

    private triggerReposition(): void {
      let customTable = this
      if (!ticking) {
        window.requestAnimationFrame((): void => {
          customTable.reposition.call(customTable)
        })
        ticking = true
      }
    }

    private debouncedtriggerReposition = debounce(this.triggerReposition.bind(this), 400)

    private addLoadingBackground = (): void => {
      if (isFixedTable(this.props.style)) { return }
      if (!this.tableRef.current) { return }
      const parentElement = this.tableRef.current.parentElement
      if (!parentElement) { return }
      this.tableRef.current.style.background = 'white'
      parentElement.style.backgroundImage = `url(${LoadingPic})`
      parentElement.style.backgroundPosition = 'center'
      parentElement.style.backgroundRepeat = 'no-repeat'
    }

    public componentDidMount(): void {
      if (!this.tableRef.current) { return }
      const parentElement = this.tableRef.current.parentElement
      if (!parentElement) { return }
      this.addLoadingBackground()
      // left or right fixed table will also use this customTable to render
      // dont want to bind scroll event on them
      parentElement.style.position = 'relative'
      if (isFixedTable(this.props.style)) { return }
      parentElement.style.overflow = 'scroll'
      parentElement.addEventListener('scroll', this.reposition.bind(this), {
        passive: true
      })
    }
    public componentWillUnmount(): void {
      if (!this.tableRef.current) { return }
      if (isFixedTable(this.props.style)) { return }
      const parentElement = this.tableRef.current.parentElement
      parentElement && parentElement.removeEventListener('scroll', this.reposition)
    }
    public render(): JSX.Element {
      const tableStyle = this.props.style
      tableStyle.position = 'relative'
      tableStyle.top = tableTop.main
      
      return (<>
        <table
          {...this.props}
          ref={this.tableRef}
          style={tableStyle}
        />
        <div
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            top: itemHeight * (total)
          }}
        >
        </div>
      </>)
    }
  }

  (CustomTable as React.ComponentClass<{style: React.CSSProperties}>).displayName  = 'CustomTable'
  return CustomTable as React.ComponentClass<{style: React.CSSProperties}>
}

class InfinityTable<T> extends React.Component<InfiniteTableProps<T>, InfiniteTableState> {

  public state = {
    startIndex: 0,
    endIndex: pageSize,
  }

  private infiniteTableRef = React.createRef<Table<T>>()

  public render(): JSX.Element {
    const {  dataSource, components, itemHeight, total, ...rest } = this.props
    const {startIndex, endIndex} = this.state
    const customTable = getCustomTable(itemHeight, total, this)
    return (
      <Table
        ref={this.infiniteTableRef}
        components={{
          ...components,
          table: customTable
        }}
        {...rest}
        dataSource={dataSource && dataSource.slice(startIndex, endIndex)}
        pagination={false}
      />)
  }
}

export default InfinityTable
