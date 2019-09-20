// infinite table 大致原理：
// 1. 基于 Table 组件封装
// 2. 利用 components 属性注入了自定义的 table 组件，这个组件实现了虚拟滚动
// 3. 虚拟滚动的实现方式是用一个容器渲染 table 以及另一个肉眼不可见的 1x1 px 大小的定位元素，
//    容器 position 为 relative , 在它上面绑定了 scroll 监听事件
//    定位元素 position 为 absolute , 它的 top 为 totalTableRowCount * tableRowHeight ，用于撑开容器的高度
//    table 元素 position 为 relative , 它的 top 通过 scroll 事件更新，
//    table 元素不会把全部的 row 都渲染出来，它只会渲染其中的一部分，这也通过 scroll 事件回调计算出来


// 关于应用固定列时会出现抖动的问题：

// rc-table 组件 Table.js 在 componentDidUpdate 钩子中 当 isAnyColumnsFixed 为 true 时，会触发  handleWindowResize
// 继而调用 syncFixedTableRowHeight / setScrollPositionClassName 两个方法
// 这两个方法内部都会触发 reflow (DOM 元素属性取值： getBoundingClientRect/scrollLeft)

// rc-table 组件 TableRow.js 在 componentDidMount 钩子中会调用 saveRowRef ，当 isAnyColumnsFixed 为 true 时，
// 有可能调用 setRowHeight 方法，继而调用 getBoundingClientRect ，同样也会触发 reflow ，


// 触发 reflow 就会让 scrollTop 改变，继而触发 antd table 内部的 onScroll 事件


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

let tableTop = 0
let ticking = false
let formerStartIndex = 0
let formerEndIndex = 0

const getCustomTable = (itemHeight: number, total: number, instance: React.Component<any>): React.ComponentClass<{style: React.CSSProperties}> => {
  class CustomTable extends React.Component<{style: React.CSSProperties}> {
    private infiniteTableInstance = instance
    private tableRef = React.createRef<HTMLTableElement>()

    private calculateTableTop = (scrollTop: number): number => {
      let margin = (scrollTop / itemHeight % 1) * itemHeight
      return Math.max(scrollTop - preTableItem * itemHeight - margin, 0)
    }

    private isFixedTable = (): boolean => {
      if (!this.tableRef.current) {return false}
      const tableContainer = this.tableRef.current.parentElement as HTMLElement
      return tableContainer.className.indexOf('ant-table-body-inner') !== -1
    }

    private calculateIndexs = (containerScrollTop: number): {startIndex: number; endIndex: number} => {
      // itemHeight tr 的高度
      // currentTableTrIndexInView 当前刚好能看得到的 tr 的 Index
      const currentTableTrIndexInView = Math.floor(containerScrollTop / itemHeight)
      // startIndex dataSource 的切片开始值
      const startIndex = Math.max(currentTableTrIndexInView - preTableItem, 0)
      // endIndex dataSource 的切片结束值
      const endIndex = startIndex + pageSize - 1
      return {
        startIndex,
        endIndex
      }
    }

    private reposition = (): void  => {
      if (!this.tableRef.current) {
        ticking = false
        return
      }
      const table = this.tableRef.current
      const containerScrollTop = (table.parentElement as HTMLElement).scrollTop
      const {startIndex, endIndex} = this.calculateIndexs(containerScrollTop)
      tableTop = this.calculateTableTop(containerScrollTop)
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

    private triggerReposition = (): void => {
      if (ticking) { return }
      window.requestAnimationFrame((): void => {
        this.reposition()
      })
      ticking = true
    }

    private debouncedtriggerReposition = debounce(this.triggerReposition, 200)

    private addLoadingBackground = (): void => {
      if (this.isFixedTable()) { return }
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
      // dont bind scroll event on them
      parentElement.style.position = 'relative'
      if (this.isFixedTable()) { return }
      parentElement.style.overflow = 'scroll'
      parentElement.addEventListener('scroll', this.debouncedtriggerReposition, {
        passive: true
      })
    }

    public componentWillUnmount(): void {
      if (!this.tableRef.current) { return }
      if (this.isFixedTable()) { return }
      const parentElement = this.tableRef.current.parentElement
      parentElement && parentElement.removeEventListener('scroll', this.debouncedtriggerReposition)
    }

    public render(): JSX.Element {
      const tableStyle = this.props.style
      tableStyle.position = 'relative'
      tableStyle.top = tableTop
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

  public render(): JSX.Element {
    const { dataSource, components, itemHeight, total, ...rest } = this.props
    const {startIndex, endIndex} = this.state
    const customTable = getCustomTable(itemHeight, total, this)
    return (
      <Table
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
