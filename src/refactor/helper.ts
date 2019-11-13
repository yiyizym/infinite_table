import {Fixed, VirtualTableProps, RowLoadStatus, StoreType} from "./interfaces";
import Store, {getCurrentID} from "./store";


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


export const collectRowHeight = (index: number, height: number): void => {
    console.assert(height !== 0);
    const store = Store.get(getCurrentID()) as StoreType;
    const { computedTbodyHeight = 0, rowHeight = [] } = store;
    let newComputedHeight = computedTbodyHeight;
    if(store.possibleRowHeight === -1) {
        store.possibleRowHeight = height;
    }

    if(rowHeight[index]) {
        newComputedHeight += (height - rowHeight[index])
    } else {
        newComputedHeight += height - store.possibleRowHeight;
    }

    rowHeight[index] = height;

    if(computedTbodyHeight !== newComputedHeight && store.rowLoadStatus !== RowLoadStatus.INIT) {
        updateWrapStyle(store.wrapInst.current as  HTMLDivElement, newComputedHeight);
        const leftFixedStore = Store.get(0 - getCurrentID());
        const rightFixedStore = Store.get((1 << 31) + getCurrentID());

        leftFixedStore && updateWrapStyle(leftFixedStore.wrapInst.current as HTMLDivElement, newComputedHeight);
        rightFixedStore && updateWrapStyle(rightFixedStore.wrapInst.current as HTMLDivElement, newComputedHeight);
    }

    store.computedTbodyHeight = newComputedHeight;
    store.rowHeight = rowHeight;
};


export const  setActualRowCount = (rowCount: number): void => {
    const store = Store.get(getCurrentID()) as StoreType;
    const preRowCount = store.rowCount || 0;
    store.reComputeCount = rowCount - preRowCount;
    store.rowCount = rowCount;
};


export const predicateTbodyHeight = (): void => {
    const store = Store.get(getCurrentID()) as StoreType;
    const { possibleRowHeight, rowLoadStatus, rowCount, rowHeight } = store;
    let { computedTbodyHeight = 0, reComputeCount } = store;

    if(rowLoadStatus === RowLoadStatus.INIT) return;

    // row 的数量比之前的要少
    if(reComputeCount < 0) {
        for (let i = rowCount; reComputeCount < 0; ++i,++reComputeCount){
            if(!rowHeight[i]) { rowHeight[i] = possibleRowHeight }
            computedTbodyHeight -= rowHeight[i];
        }
    }
    // row 的数量比之前的要多
    else if(reComputeCount > 0) {
        for (let i = rowCount - 1; reComputeCount > 0; --i,--reComputeCount) {
            if(!rowHeight[i]) { rowHeight[i] = possibleRowHeight }
            computedTbodyHeight += rowHeight[i];
        }
    }

    store.computedTbodyHeight = computedTbodyHeight;
};


export const calculatePositions = (scrollTop: number): [number, number, number] => {
    const store = Store.get(getCurrentID()) as StoreType;
    const { rowHeight, rowCount, height, possibleRowHeight, overScanRowCount } = store;

    let overScanCount = overScanRowCount as number;

    const offsetHeight = store.wrapInst.current!.parentElement!.offsetHeight; // HACK

    let accumulatedTop = 0, i = 0;
    for(; i < rowCount; i++) {
        if(accumulatedTop > scrollTop) break;
        accumulatedTop += (rowHeight[i] || possibleRowHeight);
    }

    while(i > 0 && overScanCount-- > 0) {
        accumulatedTop -= (rowHeight[--i] || possibleRowHeight);
    }

    overScanCount = overScanRowCount as number * 2;

    let toRenderHeight = 0, j = i;
    for (; j < rowCount;) {
        if(toRenderHeight > (height || offsetHeight)) break;
        toRenderHeight += (rowHeight[++j] || possibleRowHeight);
    }

    // 这步处理到底有没有必要
    while(overScanCount-- > 0 && j < rowCount) {
        toRenderHeight += (rowHeight[j] || possibleRowHeight);
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


export const log = (...args: any): void => {
    const store = Store.get(getCurrentID()) as StoreType;
    if(!store.debug) { return }
    console.log(...args);
};
