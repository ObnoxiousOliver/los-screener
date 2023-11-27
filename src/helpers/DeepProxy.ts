export type DeepProxy<T extends object> = T & { __deepProxyTarget__?: T }
export interface DeepProxyHandler  {
  set?: (target: any, prop: string | symbol, value: any, receiver: any, path: any[]) => boolean | void
  get?: (target: any, prop: string | symbol, oldValue: any, path: any[]) => any
  deleteProperty?: (target: any, prop: string | symbol, path: any[]) => boolean | void
}

export function deepProxy<T extends object> (obj: T, handler: DeepProxyHandler, path: any[] = []): DeepProxy<T> {
  path = [...path, obj]

  const proxyHandler: ProxyHandler<T> = {
    set: (target, prop, value) => {
      const valid = handler.set?.(target, prop, value, (target as any)[prop], path)

      if (valid === false) {
        return false
      }

      if (typeof value === 'object') {
        // console.log('deep proxying', value);
        (target as any)[prop] = deepProxy(value, handler, path)
      }
      return true
    },
    get: (target, prop) => {
      const value = handler.get?.(target, prop, (target as any)[prop], path)
      if (value) {
        return value
      }
      return (target as any)[prop]
    },
    deleteProperty: (target, prop) => {
      const valid = handler.deleteProperty?.(target, prop, path)
      if (valid === false) {
        return false
      }
      return delete (target as any)[prop]
    }
  }

  const proxy: DeepProxy<T> = new Proxy(obj, proxyHandler)
  Object.keys(proxy).forEach(key => {
    const val: any = (proxy as any)[key]
    if (val && typeof val === 'object') {
      // console.log('deep proxying', val);
      (proxy as any)[key] = deepProxy(val, handler, path)
    }
  })
  proxy.__deepProxyTarget__ = obj
  return proxy as DeepProxy<T>
}

export function unwrap<T extends object> (obj: DeepProxy<T>): T {
  const raw = obj && obj['__deepProxyTarget__']
  return raw ? unwrap(raw) : obj
}