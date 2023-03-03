function createElement(type, props, ...children) {
    return {
        type,
        props: {
            ...props,
            children: children.map(child => typeof child === 'object' ? child : createTextElement(child))
        }
    }
}
function createTextElement(text) {
    return {
        type: 'TEXT_ELEMENT',
        props: {
            nodeValue: text,
            children: []
        }
    }
}
let nextUnitOfWork = null

function render(element, container) {
    //将根节点设置成第一个要完成的工作单元
    nextUnitOfWork = {
        dom: container,
        props: {
            children: [element]
        }
    }
}
function createDom(element, container) {
    const dom = element.type === 'TEXT_ELEMENT' ? document.createTextNode('') : document.createElement(element.type)
    const isProperty = prop => prop != 'children'
    Object.keys(element.props).filter(isProperty).forEach(item => {
        dom[item] = element.props[item]
    })
    return dom
}

function workLoop(deadline) {
    let shouldYield = false
    while (nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
        //当前帧空余时间要没了，停止工作循环
        shouldYield = deadline.timeRemaining() < 1
        console.log(shouldYield,'shouldYield')
    }
    //空闲时间执行任务
    requestIdleCallback(workLoop)
}
requestIdleCallback(workLoop)

function performUnitOfWork(fiber) {
   if(!fiber.dom){
    fiber.dom = createDom(fiber)
   }
   if(fiber.parent){
    fiber.parent.dom.appendChild(fiber.dom)
   }
   //获取当前fiber的孩子节点
   const elements = fiber.props.children
   let index = 0
   let prevSibling = null

   while(index <elements.length){
    const element = elements[index]
    const newFiber = {
        type:element.type,
        props:element.props,
        parent:fiber,
        dom:null
    }
    if(index ===0){
        fiber.child = newFiber
    }else if(element){
        prevSibling.sibling = newFiber
    }
    prevSibling = newFiber;
    index ++
   }
   if(fiber.child){
    return fiber.child
   }
   let nextFiber = fiber
   while(nextFiber){
    if(nextFiber.sibling){
        return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
   }
}


const Didact = {
    createElement,
    render
};
/** @jsx Didact.createElement */
const element = (
    <div style="background: salmon">
        <h1>Hello World</h1>
        <h2 style="text-align:right">from1 Didact</h2>
    </div>
);
const container = document.getElementById("root");
Didact.render(element, container);
