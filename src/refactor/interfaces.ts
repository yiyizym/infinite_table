import React, {ReactNode} from "react";

interface ObjWithAny {
    [key: string]: any
}

export enum Fixed {
    UNKNOWN = -1,
    NO,
    LEFT,
    RIGHT
}

export enum ReComputeType {
    NOT_CHANGED,
    INCREASE,
    DECREASE
}

export enum RowLoadStatus {
    INIT,
    LOADED,
    RUNNING,
}

export interface consolidatedEventType {
    top: number;
    left: number;
    flag: number;
}

export enum ScrollEvent {
    NULL = 0,
    INIT = 1, // 1
    RECOMPUTE = 2,// 10
    RESTORE = 4, // 100
    NATIVE = 8, // 1000
    BARRIER = 16, // 10000
    MASK = 0x7, // 111
}

export interface ScrollHookOpts {
    target: {
        scrollTop: number;
        scrollLeft: number
    };
    flag: ScrollEvent;
}

export interface StoreType extends VirtualTableOpts {
    components: {
        table: React.ElementType,
        wrapper: React.ElementType,
        row: React.ElementType
    };
    computedTbodyHeight: number;
    rowHeight: number[];
    rowCount: number;
    possibleRowHeight: number;
    reComputeCount: number;
    wrapInst: React.RefObject<HTMLDivElement>;
    context: React.Context<VirtualTableContext>;
    rowLoadStatus: RowLoadStatus;
    leftPointer: any;
    rightPointer: any;
}

export interface VirtualTableContext {
    head: number;
    tail: number;
    fixed: Fixed;
}

export interface VirtualTableProps extends ObjWithAny {
    children: TableChildrenProps[];
    style: React.CSSProperties;
}

export interface VirtualTableState {
    top: number;
    head: number;
    tail: number;
}

interface TableChildrenProps {
    props: {
        fixed: 'left'|'right'|undefined;
        children: any[];
    }
}

export interface VirtualTableOpts {
    readonly id: number;
    overscanRowCount?: number;
}

interface PropsWithIndex {
    props: {
        index: number;
    }
}

export interface VirtualTableRowProps {
    children: PropsWithIndex[]
}


export interface VirtualTableWrapperProps {
    children: any[];
}
