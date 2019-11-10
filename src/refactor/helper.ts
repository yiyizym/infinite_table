import {Fixed, PropsType} from "@/refactor/interfaces";



export const getFixedType = (props: PropsType): Fixed => {
    const map = {
        'left': Fixed.LEFT,
        'right': Fixed.RIGHT,
    }
    return props.children[0].props.fixed ? map[props.children[0].props.fixed] : Fixed.NO;
}
