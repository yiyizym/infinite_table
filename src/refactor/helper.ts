import {Fixed, PropsType, ReComputeType, RowLoadStatus, StoreType} from "@/refactor/interfaces";
import Store, {getCurrentID} from "@/refactor/store";


export const getFixedType = (props: PropsType): Fixed => {
    const map = {
        'left': Fixed.LEFT,
        'right': Fixed.RIGHT,
    }
    return props.children[0].props.fixed ? map[props.children[0].props.fixed] : Fixed.NO;
}


export const updateWrapStyle = (wrap: HTMLDivElement, height: number): void => {
    wrap.style.height = `${height < 0 ? 0 : height}px`;
}


export const collectRowHeight = (index: number, height: number): void => {
    console.assert(height !== 0)
    const store = Store.get(getCurrentID()) as StoreType
    const { computedTbodyHeight, rowHeight = [] } = store
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
}


export const  setActualRowCount = (rowCount: number): void => {
    const store = Store.get(getCurrentID()) as StoreType;
    const preRowCount = store.rowCount || 0;
    store.reComputeCount = rowCount - preRowCount;
    store.rowCount = rowCount;
}


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
}
