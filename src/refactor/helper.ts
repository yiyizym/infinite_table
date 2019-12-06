import {Fixed, VirtualTableProps, RowLoadStatus, StoreType} from "./interfaces";
import Store, {getCurrentID} from "./store";
import React from "react";

export const getFixedType = (props: VirtualTableProps): Fixed => {
    const map = {
        'left': Fixed.LEFT,
        'right': Fixed.RIGHT,
    };
    return props.children[0].props.fixed ? map[props.children[0].props.fixed] : Fixed.NO;
};


export const updateWrapStyle = (wrap: HTMLDivElement, height: number): void => {
    wrap.style.height = `${height < 0 ? 0 : height}px`;
    wrap.style.maxHeight = `${height < 0 ? 0 : height}px`;
};


function updateTableWrapHeight(rowKey: number, row: HTMLTableRowElement) {
    const store = Store.get(getCurrentID()) as StoreType;
    let {tableWrapHeight} = store;
    if (rowKey in store.rowMap) {
        tableWrapHeight = tableWrapHeight - store.rowMap[rowKey].height + row.offsetHeight
    } else {
        tableWrapHeight += row.offsetHeight;
    }
    return tableWrapHeight;
}

export const registerRow = (rowKey: number, rowRef: React.RefObject<HTMLTableRowElement>): void => {
    const store = Store.get(getCurrentID()) as StoreType;
    const row = rowRef.current!;
    if(store.possibleRowHeight === -1) {store.possibleRowHeight = row.offsetHeight;}
    store.tableWrapHeight = updateTableWrapHeight(rowKey, row);
    if(!(rowKey in store.rowMap)) {store.rowMap[rowKey] = {height: 0}}
    store.rowMap[rowKey].height = row.offsetHeight;
};

const updateRowHeight = (tableBodyInstance: React.RefObject<HTMLTableSectionElement>): void => {
    const store = Store.get(getCurrentID()) as StoreType;
    const rows = Array.from(tableBodyInstance.current!.querySelectorAll('tr'));
    rows.forEach((row): void => {
        let rowKey = Number(row.getAttribute('data-row-key') || '0');
        store.tableWrapHeight = updateTableWrapHeight(rowKey, row);
        store.rowMap[rowKey].height = row.offsetHeight;
    });
};

export const  setActualRowCount = (rowCount: number): void => {
    const store = Store.get(getCurrentID()) as StoreType;
    store.rowCount = rowCount;
};

export const updateTableWrapStyle = (): void => {
    const store = Store.get(getCurrentID()) as StoreType;
    if(store.rowLoadStatus !== RowLoadStatus.LOADED) {return;}
    updateWrapStyle(store.wrapInst.current as  HTMLDivElement, store.tableWrapHeight);
    const leftFixedStore = Store.get(0 - getCurrentID());
    const rightFixedStore = Store.get((1 << 31) + getCurrentID());
    leftFixedStore && updateWrapStyle(leftFixedStore.wrapInst.current as HTMLDivElement, store.tableWrapHeight);
    rightFixedStore && updateWrapStyle(rightFixedStore.wrapInst.current as HTMLDivElement, store.tableWrapHeight);
};


export const upateRowAndbodyHeight = (tableBodyInstance: React.RefObject<HTMLTableSectionElement>): void => {
    updateRowHeight(tableBodyInstance);
    updateTableWrapStyle();
};


export const calculatePositions = (scrollTop: number): [number, number, number] => {
    const store = Store.get(getCurrentID()) as StoreType;
    const { rowMap, rowCount, height, possibleRowHeight, overScanRowCount } = store;
    const rowHeight = Object.values(rowMap).map(record => record.height);

    let overScanCount = overScanRowCount as number;

    const offsetHeight = store.wrapInst.current!.parentElement!.offsetHeight; // HACK

    let accumulatedTop = 0, i = 0;
    for(; i < rowCount; i++) {
        if(accumulatedTop > scrollTop) break;
        accumulatedTop += (rowHeight[i] || possibleRowHeight);
    }

    // 确定加载进来的第一条条目的高度位置
    while(i > 0 && overScanCount-- > 0) {
        accumulatedTop -= (rowHeight[--i] || possibleRowHeight);
    }

    // 加载前面以及看得见的条目
    let toRenderHeight = 0, j = i;
    for (; j < rowCount;) {
        if(toRenderHeight > (height || offsetHeight)) break;
        toRenderHeight += (rowHeight[++j] || possibleRowHeight);
    }

    // 加载后面看不见的条目
    overScanCount = overScanRowCount as number;
    while(overScanCount-- > 0 && j < rowCount) {
        j++;
    }
    return [i, j, 0|accumulatedTop];

};


export const scrollTo = (top: number, left: number): void => {
    const store = Store.get(getCurrentID()) as StoreType;
    store.wrapInst.current!.parentElement!.scrollTo(left, top);

    const leftFixedStore = Store.get(0 - getCurrentID()), rightFixedStore = Store.get(1 << 31 + getCurrentID());
    if(leftFixedStore) { leftFixedStore.wrapInst.current!.parentElement!.scrollTo(left, top) }
    if(rightFixedStore) { rightFixedStore.wrapInst.current!.parentElement!.scrollTo(left, top) }
};
