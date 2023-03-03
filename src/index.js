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
let wipRoot = null
let currentRoot = null //更新前的根节点fiber树
let delections = null //存储要删除的fiber
function render(element, container) {
    //将根节点设置成第一个要完成的工作单元
    wipRoot = {
        dom: container,
        props: {
            children: [element]
        },
        alternate: currentRoot
    }
    nextUnitOfWork = wipRoot
    delections = []
}
function createDom(fiber) {
    const dom = fiber.type === 'TEXT_ELEMENT' ? document.createTextNode('') : document.createElement(element.type)
    updateDom(dom, {}, fiber.props)
    return dom
}
const isProperty = key => key !== "children" &&!isEvent(key)
const isNew = (prev, next) => key => prev[key] !== next[key] //判断是否有新属性
const isGone = (prev, next) => key => !(key in next) //是否是旧属性
const isEvent = key =>key.startsWith('on')
function updateDom(dom, prevProps, nextProps) {
    //移除老的属性
    Object.keys(prevProps).filter(isProperty).filter(isGone(prevProps, nextProps)).forEach(name => dom[name] = '')
   //移除老的事件监听
   Object.keys(prevProps)
   .filter(isEvent).filter(key =>!(key in nextProps)||isNew(prevProps,nextProps)(key))
   .forEach(name=>{
    const eventType = name.toLowerCase().substring(2)
    dom.removeEventListener(eventType,prevProps[name])
   })
    //设置新的属性
    Object.keys(nextProps).filter(isProperty).filter(isNew(prevProps, nextProps)).forEach(name => { dom[name] = nextProps[name] })
   //添加新的事件处理
   Object.keys(nextProps).filter(isEvent).filter(isNew(prevProps, nextProps)).forEach(name =>{
    const eventType = name.toLowerCase().substring(2)
    dom.addEventListener(eventType,nextProps[name])
   })
}

//递归处理fiber tree
function commitWork(fiber) {
    if (!fiber) {
        return
    }
    const domParent = fiber.parent.dom
    if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
        domParent.appendChild(fiber.dom)
    } else if (fiber.effectTag === 'DELETION') {
        domParent.removeChild(fiber.dom)
    } else if (
        fiber.effectTag === "UPDATE" && fiber.dom != null
    ) {
        updateDom(
            fiber.dom,
            fiber.alternate.props,
            fiber.props
        )
    }
    //渲染子节点
    commitWork(fiber.child)
    //渲染兄弟节点
    commitWork(fiber.sibling)
}
//将fiber tree渲染为真实DOM
function commitRoot() {
    delections.forEach(commitWork)
    commitWork(wipRoot.child)
    currentRoot = wipRoot
    wipRoot = null
}
function workLoop(deadline) {
    let shouldYield = false
    while (nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
        //当前帧空余时间要没了，停止工作循环
        shouldYield = deadline.timeRemaining() < 1
    }
    if (!nextUnitOfWork && wipRoot) {
        commitRoot()
    }
    //空闲时间执行任务
    requestIdleCallback(workLoop)
}
requestIdleCallback(workLoop)

function performUnitOfWork(fiber) {
    if (!fiber.dom) {
        fiber.dom = createDom(fiber)
    }
    //获取当前fiber的孩子节点
    const elements = fiber.props.children
    reconcileChildren(fiber, elements)
    if (fiber.child) {
        return fiber.child
    }
    let nextFiber = fiber
    while (nextFiber) {
        if (nextFiber.sibling) {
            return nextFiber.sibling
        }
        nextFiber = nextFiber.parent
    }
}

function reconcileChildren(wipFiber, elements) {
    let index = 0
    let prevSibling = null
    //上一次渲染的fiber
    let oldFiber = wipFiber.alternate && wipFiber.alternate.child
    while (index < elements.length || oldFiber != null) {
        const element = elements[index]
        let newFiber = null
        const sameType = oldFiber && element && element.type == oldFiber.type
        if (sameType) {
            newFiber = {
                type: oldFiber.type,
                props: element.props,
                dom: oldFiber.dom,
                parent: wipFiber,
                alternate: oldFiber,
                effectTag: "UPDATE",
            }
        }
        if (element && !sameType) {
            newFiber = {
                type: element.type,
                props: element.props,
                dom: null,
                parent: wipFiber,
                alternate: null,
                effectTag: "PLACEMENT"
            }
        }
        if (oldFiber && !sameType) {
            oldFiber.effectTag = "DELETION"
            delections.push(oldFiber)
        }
        if(oldFiber){
            oldFiber = oldFiber.sibling
        }
        if (index === 0) {
            wipFiber.child = newFiber
        } else if (element) {
            prevSibling.sibling = newFiber
        }
        prevSibling = newFiber;
        index++
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
        <input type="text"/>
        <h2 style="text-align:right">from1 Didact</h2>
    </div>
);
const container = document.getElementById("root");
Didact.render(element, container);
