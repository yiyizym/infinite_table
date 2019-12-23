import React from 'react'
import {Fixed, RowLoadStatus, StoreType, VirtualTableContext, VirtualTableOpts} from './interfaces'
import Store, {setCurrentID} from './store'
import {TableComponents} from 'antd/es/table'
import VirtualTable from './VirtualTable'
import VirtualTableWrapper from './VirtualTableWrapper'
import VirtualTableRow from './VirtualTableRow'

const init = (opts: VirtualTableOpts): StoreType => {
  let actualOpts = Object.assign({}, {overScanRowCount: 5}, opts)
  setCurrentID(actualOpts.id)
  const inner = (Store.get(actualOpts.id) || actualOpts) as StoreType
  if (!inner.components) {
    Store.set(actualOpts.id, inner)
    inner.context = React.createContext<VirtualTableContext>({head: 0, tail: 0, fixed: Fixed.UNKNOWN})
    inner.components = { table: VirtualTable, wrapper: VirtualTableWrapper, row: VirtualTableRow }
  }
  inner.tableLoadStatus = RowLoadStatus.INIT
  return inner
}


export const VirtualComponents = (opts: VirtualTableOpts): TableComponents => {
  const inner = init(opts)
  return {
    table: inner.components.table,
    body: {
      wrapper: inner.components.wrapper,
      row: inner.components.row
    }
  }
}
