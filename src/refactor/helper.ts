import {Fixed, VirtualTableProps, RowLoadStatus, StoreType} from './interfaces'
import Store, {getCurrentID} from './store'
import React from 'react'

export const getFixedType = (props: VirtualTableProps): Fixed => {
  const map = {
    'left': Fixed.LEFT,
    'right': Fixed.RIGHT,
  }
  return props.children[0].props.fixed ? map[props.children[0].props.fixed] : Fixed.NO
}


export const updateWrapStyle = (wrap: HTMLDivElement, height: number): void => {
  wrap.style.height = `${height < 0 ? 0 : height}px`
  wrap.style.maxHeight = `${height < 0 ? 0 : height}px`
}


const updateTableWrapHeight = (rowKey: number, row: HTMLTableRowElement): number => {
  const store = Store.get(getCurrentID()) as StoreType
  let {tableWrapHeight} = store
  if (rowKey in store.rowMap) {
    tableWrapHeight = tableWrapHeight - store.rowMap[rowKey].height + row.offsetHeight
  } else {
    tableWrapHeight += row.offsetHeight
  }
  return tableWrapHeight
}

export const recordRowHeight = (rowKey: number, row: HTMLTableRowElement): void => {
  const store = Store.get(getCurrentID()) as StoreType
  store.tableWrapHeight = updateTableWrapHeight(rowKey, row)
  if (!(rowKey in store.rowMap)) {store.rowMap[rowKey] = {height: 0}}
  store.rowMap[rowKey].height = row.offsetHeight
}

const updateRowHeight = (tableInstance: React.RefObject<HTMLTableElement>): void => {
  if (!tableInstance.current) { return }
  const store = Store.get(getCurrentID()) as StoreType
  const rows = Array.from(tableInstance.current.querySelectorAll('tr'))
  rows.forEach((row): void => {
    let rowKey = Number(row.getAttribute('data-row-key') || '0')
    recordRowHeight(rowKey, row)
  })
}

export const  setActualRowCount = (rowCount: number): void => {
  const store = Store.get(getCurrentID()) as StoreType
  store.rowCount = rowCount
}

export const updateTableWrapStyle = (): void => {
  const store = Store.get(getCurrentID()) as StoreType
  if (store.tableLoadStatus !== RowLoadStatus.LOADED) {return}
  updateWrapStyle(store.wrapInst.current as  HTMLDivElement, store.tableWrapHeight)
  const leftFixedStore = Store.get(0 - getCurrentID())
  const rightFixedStore = Store.get((1 << 31) + getCurrentID())
  leftFixedStore && updateWrapStyle(leftFixedStore.wrapInst.current as HTMLDivElement, store.tableWrapHeight)
  rightFixedStore && updateWrapStyle(rightFixedStore.wrapInst.current as HTMLDivElement, store.tableWrapHeight)
}


export const upateRowAndbodyHeight = (tableInstance: React.RefObject<HTMLTableElement>): void => {
  updateRowHeight(tableInstance)
  updateTableWrapStyle()
}


export const calculatePositions = (scrollTop: number): [number, number, number] => {
  const store = Store.get(getCurrentID()) as StoreType
  const { rowMap, rowCount, height, overScanRowCount } = store
  const rowHeight = Object.values(rowMap).map(record => record.height)
  const possibleRowHeight = rowHeight[0]
  let overScanCount = overScanRowCount as number


  // HACK
  let offsetHeight = 10000
  if (store.wrapInst.current && store.wrapInst.current.parentElement) {
    offsetHeight = store.wrapInst.current.parentElement.offsetHeight
  }

  let accumulatedTop = 0; let i = 0
  for (; i < rowCount; i++) {
    if (accumulatedTop > scrollTop) {break}
    accumulatedTop += (rowHeight[i] || possibleRowHeight)
  }

  // 确定加载进来的第一条条目的高度位置
  while (i > 0 && overScanCount-- > 0) {
    accumulatedTop -= (rowHeight[--i] || possibleRowHeight)
  }

  // 加载前面以及看得见的条目
  let toRenderHeight = 0; let j = i
  for (; j < rowCount;) {
    if (toRenderHeight > (height || offsetHeight)) {break}
    toRenderHeight += (rowHeight[++j] || possibleRowHeight)
  }

  // 加载后面看不见的条目
  overScanCount = overScanRowCount as number
  while (overScanCount-- > 0 && j < rowCount) {
    j++
  }
  return [i, j, 0 | accumulatedTop]
}


export const scrollTo = (top: number, left: number): void => {
  const store = Store.get(getCurrentID()) as StoreType
  if (store.wrapInst.current && store.wrapInst.current.parentElement) {
    store.wrapInst.current.parentElement.scrollTo(left, top)
  }

  const leftFixedStore = Store.get(0 - getCurrentID()); const rightFixedStore = Store.get(1 << 31 + getCurrentID())
  if (leftFixedStore && leftFixedStore.wrapInst.current && leftFixedStore.wrapInst.current.parentElement) {
    leftFixedStore.wrapInst.current.parentElement.scrollTo(left, top)
  }
  if (rightFixedStore && rightFixedStore.wrapInst.current && rightFixedStore.wrapInst.current.parentElement) {
    rightFixedStore.wrapInst.current.parentElement.scrollTo(left, top)
  }
}
