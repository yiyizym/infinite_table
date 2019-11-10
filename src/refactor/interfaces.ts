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

export interface VirtualTableContext {
    head: number;
    tail: number;
    fixed: Fixed;
}

export interface VirtualTableProps extends ObjWithAny {
    children: ReactNode;
    style: React.CSSProperties;
}

export interface VirtualTableState {
    top: number;
    head: number;
    tail: number;
}

interface PropsWithFixed {
    props: {
        fixed: 'left'|'right'|undefined;
    }
}

export interface PropsType {
    children: PropsWithFixed[]
}

export interface VirtualTableOpts {
    readonly id: number;
    overscanRowCount?: number;
}

export interface Store extends VirtualTableOpts {
    components: {
        table: React.ElementType,
        wrapper: React.ElementType,
        row: React.ElementType
    };
    computedHeight: number;
    rowHeight: number[];
    rowCount: number;
    possibleRowHeight: number;
    shouldCompute: boolean;
    wrapInst: React.RefObject<HTMLDivElement>;
    context: React.Context<VirtualTableContext>;
    leftPointer: any;
    rightPointer: any;
}
