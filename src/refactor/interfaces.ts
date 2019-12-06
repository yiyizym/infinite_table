import React from "react";
import VirtualTable from "./VirtualTable";

interface ObjWithAny {
    [key: string]: any
}

export enum Fixed {
    UNKNOWN = -1,
    NO,
    LEFT,
    RIGHT,
}

export enum RowLoadStatus {
    INIT,
    LOADED,
    RUNNING,
    CACHE
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
    height?: number;
    tableWrapHeight: number;
    rowMap: { [key: string]: {
        height: number;
    }};
    rowHeight: number[];
    rowCount: number;
    possibleRowHeight: number;
    wrapInst: React.RefObject<HTMLDivElement>;
    context: React.Context<VirtualTableContext>;
    rowLoadStatus: RowLoadStatus;
    leftPointer: VirtualTable;
    rightPointer: VirtualTable;
    debug: boolean;
}

export interface FixedStoreType {
    wrapInst: React.RefObject<HTMLDivElement>;
    leftPointer?: VirtualTable;
    rightPointer?: VirtualTable;
}

export interface VirtualTableContext {
    head: number;
    tail: number;
    fixed: Fixed;
}

export interface VirtualTableProps extends ObjWithAny {
    children: TableChildrenProps[];
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
    overScanRowCount?: number;
    debug?: boolean;
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
