/**
 * ChKSz 插件的公共类型补充。
 *
 * types/plugin.d.ts 是 MusicFree 的预置声明，不允许修改；
 * userVariables 等扩展字段在这里补充。
 */

/** MusicFree 插件设置中声明的用户变量 */
export interface ChKSzUserVariableDecl {
  key: string;
  name: string;
  hint?: string;
}

/** 带用户变量声明的插件定义 */
export type ChKSzPluginDefine = IPlugin.IPluginDefine & {
  userVariables?: ChKSzUserVariableDecl[];
};

/**
 * 插件方法运行时的 this。
 *
 * MusicFree 调用插件方法时会把插件实例作为 this 传入，
 * 用户填写过的用户变量存放在 this.userVariables（键值对）。
 * 用户未填写时可能是声明数组或 undefined，取值时需做兼容。
 */
export interface ChKSzPluginSelf {
  userVariables?: unknown;
}
