import * as adapter from '@astrojs/netlify/netlify-functions.js';
import { escape } from 'html-escaper';
import mime from 'mime';
import sharp$1 from 'sharp';
/* empty css                        */import { optimize } from 'svgo';
import { doWork } from '@altano/tiny-async-pool';
import { dim, bold, red, yellow, cyan, green, bgGreen, black } from 'kleur/colors';
import fs from 'node:fs/promises';
import OS from 'node:os';
import path, { basename as basename$1, extname as extname$1, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import MagicString from 'magic-string';
import { Readable } from 'node:stream';
import slash from 'slash';
import sizeOf from 'image-size';
import 'string-width';
import 'path-browserify';
import { compile } from 'path-to-regexp';

const $$module1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  get warnForMissingAlt () { return warnForMissingAlt; },
  get Image () { return $$Image; },
  get Picture () { return $$Picture; }
}, Symbol.toStringTag, { value: 'Module' }));

const ASTRO_VERSION = "1.2.6";
function createDeprecatedFetchContentFn() {
  return () => {
    throw new Error("Deprecated: Astro.fetchContent() has been replaced with Astro.glob().");
  };
}
function createAstroGlobFn() {
  const globHandler = (importMetaGlobResult, globValue) => {
    let allEntries = [...Object.values(importMetaGlobResult)];
    if (allEntries.length === 0) {
      throw new Error(`Astro.glob(${JSON.stringify(globValue())}) - no matches found.`);
    }
    return Promise.all(allEntries.map((fn) => fn()));
  };
  return globHandler;
}
function createAstro(filePathname, _site, projectRootStr) {
  const site = _site ? new URL(_site) : void 0;
  const referenceURL = new URL(filePathname, `http://localhost`);
  const projectRoot = new URL(projectRootStr);
  return {
    site,
    generator: `Astro v${ASTRO_VERSION}`,
    fetchContent: createDeprecatedFetchContentFn(),
    glob: createAstroGlobFn(),
    resolve(...segments) {
      let resolved = segments.reduce((u, segment) => new URL(segment, u), referenceURL).pathname;
      if (resolved.startsWith(projectRoot.pathname)) {
        resolved = "/" + resolved.slice(projectRoot.pathname.length);
      }
      return resolved;
    }
  };
}

const escapeHTML = escape;
class HTMLString extends String {
}
const markHTMLString = (value) => {
  if (value instanceof HTMLString) {
    return value;
  }
  if (typeof value === "string") {
    return new HTMLString(value);
  }
  return value;
};

class Metadata {
  constructor(filePathname, opts) {
    this.modules = opts.modules;
    this.hoisted = opts.hoisted;
    this.hydratedComponents = opts.hydratedComponents;
    this.clientOnlyComponents = opts.clientOnlyComponents;
    this.hydrationDirectives = opts.hydrationDirectives;
    this.mockURL = new URL(filePathname, "http://example.com");
    this.metadataCache = /* @__PURE__ */ new Map();
  }
  resolvePath(specifier) {
    if (specifier.startsWith(".")) {
      const resolved = new URL(specifier, this.mockURL).pathname;
      if (resolved.startsWith("/@fs") && resolved.endsWith(".jsx")) {
        return resolved.slice(0, resolved.length - 4);
      }
      return resolved;
    }
    return specifier;
  }
  getPath(Component) {
    const metadata = this.getComponentMetadata(Component);
    return (metadata == null ? void 0 : metadata.componentUrl) || null;
  }
  getExport(Component) {
    const metadata = this.getComponentMetadata(Component);
    return (metadata == null ? void 0 : metadata.componentExport) || null;
  }
  getComponentMetadata(Component) {
    if (this.metadataCache.has(Component)) {
      return this.metadataCache.get(Component);
    }
    const metadata = this.findComponentMetadata(Component);
    this.metadataCache.set(Component, metadata);
    return metadata;
  }
  findComponentMetadata(Component) {
    const isCustomElement = typeof Component === "string";
    for (const { module, specifier } of this.modules) {
      const id = this.resolvePath(specifier);
      for (const [key, value] of Object.entries(module)) {
        if (isCustomElement) {
          if (key === "tagName" && Component === value) {
            return {
              componentExport: key,
              componentUrl: id
            };
          }
        } else if (Component === value) {
          return {
            componentExport: key,
            componentUrl: id
          };
        }
      }
    }
    return null;
  }
}
function createMetadata(filePathname, options) {
  return new Metadata(filePathname, options);
}

const PROP_TYPE = {
  Value: 0,
  JSON: 1,
  RegExp: 2,
  Date: 3,
  Map: 4,
  Set: 5,
  BigInt: 6,
  URL: 7
};
function serializeArray(value, metadata = {}, parents = /* @__PURE__ */ new WeakSet()) {
  if (parents.has(value)) {
    throw new Error(`Cyclic reference detected while serializing props for <${metadata.displayName} client:${metadata.hydrate}>!

Cyclic references cannot be safely serialized for client-side usage. Please remove the cyclic reference.`);
  }
  parents.add(value);
  const serialized = value.map((v) => {
    return convertToSerializedForm(v, metadata, parents);
  });
  parents.delete(value);
  return serialized;
}
function serializeObject(value, metadata = {}, parents = /* @__PURE__ */ new WeakSet()) {
  if (parents.has(value)) {
    throw new Error(`Cyclic reference detected while serializing props for <${metadata.displayName} client:${metadata.hydrate}>!

Cyclic references cannot be safely serialized for client-side usage. Please remove the cyclic reference.`);
  }
  parents.add(value);
  const serialized = Object.fromEntries(
    Object.entries(value).map(([k, v]) => {
      return [k, convertToSerializedForm(v, metadata, parents)];
    })
  );
  parents.delete(value);
  return serialized;
}
function convertToSerializedForm(value, metadata = {}, parents = /* @__PURE__ */ new WeakSet()) {
  const tag = Object.prototype.toString.call(value);
  switch (tag) {
    case "[object Date]": {
      return [PROP_TYPE.Date, value.toISOString()];
    }
    case "[object RegExp]": {
      return [PROP_TYPE.RegExp, value.source];
    }
    case "[object Map]": {
      return [
        PROP_TYPE.Map,
        JSON.stringify(serializeArray(Array.from(value), metadata, parents))
      ];
    }
    case "[object Set]": {
      return [
        PROP_TYPE.Set,
        JSON.stringify(serializeArray(Array.from(value), metadata, parents))
      ];
    }
    case "[object BigInt]": {
      return [PROP_TYPE.BigInt, value.toString()];
    }
    case "[object URL]": {
      return [PROP_TYPE.URL, value.toString()];
    }
    case "[object Array]": {
      return [PROP_TYPE.JSON, JSON.stringify(serializeArray(value, metadata, parents))];
    }
    default: {
      if (value !== null && typeof value === "object") {
        return [PROP_TYPE.Value, serializeObject(value, metadata, parents)];
      } else {
        return [PROP_TYPE.Value, value];
      }
    }
  }
}
function serializeProps(props, metadata) {
  const serialized = JSON.stringify(serializeObject(props, metadata));
  return serialized;
}

function serializeListValue(value) {
  const hash = {};
  push(value);
  return Object.keys(hash).join(" ");
  function push(item) {
    if (item && typeof item.forEach === "function")
      item.forEach(push);
    else if (item === Object(item))
      Object.keys(item).forEach((name) => {
        if (item[name])
          push(name);
      });
    else {
      item = item === false || item == null ? "" : String(item).trim();
      if (item) {
        item.split(/\s+/).forEach((name) => {
          hash[name] = true;
        });
      }
    }
  }
}

const HydrationDirectivesRaw = ["load", "idle", "media", "visible", "only"];
const HydrationDirectives = new Set(HydrationDirectivesRaw);
const HydrationDirectiveProps = new Set(HydrationDirectivesRaw.map((n) => `client:${n}`));
function extractDirectives(inputProps) {
  let extracted = {
    isPage: false,
    hydration: null,
    props: {}
  };
  for (const [key, value] of Object.entries(inputProps)) {
    if (key.startsWith("server:")) {
      if (key === "server:root") {
        extracted.isPage = true;
      }
    }
    if (key.startsWith("client:")) {
      if (!extracted.hydration) {
        extracted.hydration = {
          directive: "",
          value: "",
          componentUrl: "",
          componentExport: { value: "" }
        };
      }
      switch (key) {
        case "client:component-path": {
          extracted.hydration.componentUrl = value;
          break;
        }
        case "client:component-export": {
          extracted.hydration.componentExport.value = value;
          break;
        }
        case "client:component-hydration": {
          break;
        }
        case "client:display-name": {
          break;
        }
        default: {
          extracted.hydration.directive = key.split(":")[1];
          extracted.hydration.value = value;
          if (!HydrationDirectives.has(extracted.hydration.directive)) {
            throw new Error(
              `Error: invalid hydration directive "${key}". Supported hydration methods: ${Array.from(
                HydrationDirectiveProps
              ).join(", ")}`
            );
          }
          if (extracted.hydration.directive === "media" && typeof extracted.hydration.value !== "string") {
            throw new Error(
              'Error: Media query must be provided for "client:media", similar to client:media="(max-width: 600px)"'
            );
          }
          break;
        }
      }
    } else if (key === "class:list") {
      extracted.props[key.slice(0, -5)] = serializeListValue(value);
    } else {
      extracted.props[key] = value;
    }
  }
  return extracted;
}
async function generateHydrateScript(scriptOptions, metadata) {
  const { renderer, result, astroId, props, attrs } = scriptOptions;
  const { hydrate, componentUrl, componentExport } = metadata;
  if (!componentExport.value) {
    throw new Error(
      `Unable to resolve a valid export for "${metadata.displayName}"! Please open an issue at https://astro.build/issues!`
    );
  }
  const island = {
    children: "",
    props: {
      uid: astroId
    }
  };
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      island.props[key] = value;
    }
  }
  island.props["component-url"] = await result.resolve(decodeURI(componentUrl));
  if (renderer.clientEntrypoint) {
    island.props["component-export"] = componentExport.value;
    island.props["renderer-url"] = await result.resolve(decodeURI(renderer.clientEntrypoint));
    island.props["props"] = escapeHTML(serializeProps(props, metadata));
  }
  island.props["ssr"] = "";
  island.props["client"] = hydrate;
  let beforeHydrationUrl = await result.resolve("astro:scripts/before-hydration.js");
  if (beforeHydrationUrl.length) {
    island.props["before-hydration-url"] = beforeHydrationUrl;
  }
  island.props["opts"] = escapeHTML(
    JSON.stringify({
      name: metadata.displayName,
      value: metadata.hydrateArgs || ""
    })
  );
  return island;
}

var idle_prebuilt_default = `(self.Astro=self.Astro||{}).idle=t=>{const e=async()=>{await(await t())()};"requestIdleCallback"in window?window.requestIdleCallback(e):setTimeout(e,200)},window.dispatchEvent(new Event("astro:idle"));`;

var load_prebuilt_default = `(self.Astro=self.Astro||{}).load=a=>{(async()=>await(await a())())()},window.dispatchEvent(new Event("astro:load"));`;

var media_prebuilt_default = `(self.Astro=self.Astro||{}).media=(s,a)=>{const t=async()=>{await(await s())()};if(a.value){const e=matchMedia(a.value);e.matches?t():e.addEventListener("change",t,{once:!0})}},window.dispatchEvent(new Event("astro:media"));`;

var only_prebuilt_default = `(self.Astro=self.Astro||{}).only=t=>{(async()=>await(await t())())()},window.dispatchEvent(new Event("astro:only"));`;

var visible_prebuilt_default = `(self.Astro=self.Astro||{}).visible=(s,c,n)=>{const r=async()=>{await(await s())()};let i=new IntersectionObserver(e=>{for(const t of e)if(!!t.isIntersecting){i.disconnect(),r();break}});for(let e=0;e<n.children.length;e++){const t=n.children[e];i.observe(t)}},window.dispatchEvent(new Event("astro:visible"));`;

var astro_island_prebuilt_default = `var l;{const c={0:t=>t,1:t=>JSON.parse(t,o),2:t=>new RegExp(t),3:t=>new Date(t),4:t=>new Map(JSON.parse(t,o)),5:t=>new Set(JSON.parse(t,o)),6:t=>BigInt(t),7:t=>new URL(t)},o=(t,s)=>{if(t===""||!Array.isArray(s))return s;const[e,n]=s;return e in c?c[e](n):void 0};customElements.get("astro-island")||customElements.define("astro-island",(l=class extends HTMLElement{constructor(){super(...arguments);this.hydrate=()=>{if(!this.hydrator||this.parentElement&&this.parentElement.closest("astro-island[ssr]"))return;const s=this.querySelectorAll("astro-slot"),e={},n=this.querySelectorAll("template[data-astro-template]");for(const r of n){const i=r.closest(this.tagName);!i||!i.isSameNode(this)||(e[r.getAttribute("data-astro-template")||"default"]=r.innerHTML,r.remove())}for(const r of s){const i=r.closest(this.tagName);!i||!i.isSameNode(this)||(e[r.getAttribute("name")||"default"]=r.innerHTML)}const a=this.hasAttribute("props")?JSON.parse(this.getAttribute("props"),o):{};this.hydrator(this)(this.Component,a,e,{client:this.getAttribute("client")}),this.removeAttribute("ssr"),window.removeEventListener("astro:hydrate",this.hydrate),window.dispatchEvent(new CustomEvent("astro:hydrate"))}}connectedCallback(){!this.hasAttribute("await-children")||this.firstChild?this.childrenConnectedCallback():new MutationObserver((s,e)=>{e.disconnect(),this.childrenConnectedCallback()}).observe(this,{childList:!0})}async childrenConnectedCallback(){window.addEventListener("astro:hydrate",this.hydrate);let s=this.getAttribute("before-hydration-url");s&&await import(s),this.start()}start(){const s=JSON.parse(this.getAttribute("opts")),e=this.getAttribute("client");if(Astro[e]===void 0){window.addEventListener(\`astro:\${e}\`,()=>this.start(),{once:!0});return}Astro[e](async()=>{const n=this.getAttribute("renderer-url"),[a,{default:r}]=await Promise.all([import(this.getAttribute("component-url")),n?import(n):()=>()=>{}]),i=this.getAttribute("component-export")||"default";if(!i.includes("."))this.Component=a[i];else{this.Component=a;for(const d of i.split("."))this.Component=this.Component[d]}return this.hydrator=r,this.hydrate},s,this)}attributeChangedCallback(){this.hydrator&&this.hydrate()}},l.observedAttributes=["props"],l))}`;

function determineIfNeedsHydrationScript(result) {
  if (result._metadata.hasHydrationScript) {
    return false;
  }
  return result._metadata.hasHydrationScript = true;
}
const hydrationScripts = {
  idle: idle_prebuilt_default,
  load: load_prebuilt_default,
  only: only_prebuilt_default,
  media: media_prebuilt_default,
  visible: visible_prebuilt_default
};
function determinesIfNeedsDirectiveScript(result, directive) {
  if (result._metadata.hasDirectives.has(directive)) {
    return false;
  }
  result._metadata.hasDirectives.add(directive);
  return true;
}
function getDirectiveScriptText(directive) {
  if (!(directive in hydrationScripts)) {
    throw new Error(`Unknown directive: ${directive}`);
  }
  const directiveScriptText = hydrationScripts[directive];
  return directiveScriptText;
}
function getPrescripts(type, directive) {
  switch (type) {
    case "both":
      return `<style>astro-island,astro-slot{display:contents}</style><script>${getDirectiveScriptText(directive) + astro_island_prebuilt_default}<\/script>`;
    case "directive":
      return `<script>${getDirectiveScriptText(directive)}<\/script>`;
  }
  return "";
}

const Fragment = Symbol.for("astro:fragment");
const Renderer = Symbol.for("astro:renderer");
function stringifyChunk(result, chunk) {
  switch (chunk.type) {
    case "directive": {
      const { hydration } = chunk;
      let needsHydrationScript = hydration && determineIfNeedsHydrationScript(result);
      let needsDirectiveScript = hydration && determinesIfNeedsDirectiveScript(result, hydration.directive);
      let prescriptType = needsHydrationScript ? "both" : needsDirectiveScript ? "directive" : null;
      if (prescriptType) {
        let prescripts = getPrescripts(prescriptType, hydration.directive);
        return markHTMLString(prescripts);
      } else {
        return "";
      }
    }
    default: {
      return chunk.toString();
    }
  }
}

function validateComponentProps(props, displayName) {
  var _a;
  if (((_a = {"BASE_URL":"/","MODE":"production","DEV":false,"PROD":true}) == null ? void 0 : _a.DEV) && props != null) {
    for (const prop of Object.keys(props)) {
      if (HydrationDirectiveProps.has(prop)) {
        console.warn(
          `You are attempting to render <${displayName} ${prop} />, but ${displayName} is an Astro component. Astro components do not render in the client and should not have a hydration directive. Please use a framework component for client rendering.`
        );
      }
    }
  }
}
class AstroComponent {
  constructor(htmlParts, expressions) {
    this.htmlParts = htmlParts;
    this.expressions = expressions;
  }
  get [Symbol.toStringTag]() {
    return "AstroComponent";
  }
  async *[Symbol.asyncIterator]() {
    const { htmlParts, expressions } = this;
    for (let i = 0; i < htmlParts.length; i++) {
      const html = htmlParts[i];
      const expression = expressions[i];
      yield markHTMLString(html);
      yield* renderChild(expression);
    }
  }
}
function isAstroComponent(obj) {
  return typeof obj === "object" && Object.prototype.toString.call(obj) === "[object AstroComponent]";
}
function isAstroComponentFactory(obj) {
  return obj == null ? false : !!obj.isAstroComponentFactory;
}
async function* renderAstroComponent(component) {
  for await (const value of component) {
    if (value || value === 0) {
      for await (const chunk of renderChild(value)) {
        switch (chunk.type) {
          case "directive": {
            yield chunk;
            break;
          }
          default: {
            yield markHTMLString(chunk);
            break;
          }
        }
      }
    }
  }
}
async function renderToString(result, componentFactory, props, children) {
  const Component = await componentFactory(result, props, children);
  if (!isAstroComponent(Component)) {
    const response = Component;
    throw response;
  }
  let html = "";
  for await (const chunk of renderAstroComponent(Component)) {
    html += stringifyChunk(result, chunk);
  }
  return html;
}
async function renderToIterable(result, componentFactory, displayName, props, children) {
  validateComponentProps(props, displayName);
  const Component = await componentFactory(result, props, children);
  if (!isAstroComponent(Component)) {
    console.warn(
      `Returning a Response is only supported inside of page components. Consider refactoring this logic into something like a function that can be used in the page.`
    );
    const response = Component;
    throw response;
  }
  return renderAstroComponent(Component);
}
async function renderTemplate(htmlParts, ...expressions) {
  return new AstroComponent(htmlParts, expressions);
}

async function* renderChild(child) {
  child = await child;
  if (child instanceof HTMLString) {
    yield child;
  } else if (Array.isArray(child)) {
    for (const value of child) {
      yield markHTMLString(await renderChild(value));
    }
  } else if (typeof child === "function") {
    yield* renderChild(child());
  } else if (typeof child === "string") {
    yield markHTMLString(escapeHTML(child));
  } else if (!child && child !== 0) ; else if (child instanceof AstroComponent || Object.prototype.toString.call(child) === "[object AstroComponent]") {
    yield* renderAstroComponent(child);
  } else if (typeof child === "object" && Symbol.asyncIterator in child) {
    yield* child;
  } else {
    yield child;
  }
}
async function renderSlot(result, slotted, fallback) {
  if (slotted) {
    let iterator = renderChild(slotted);
    let content = "";
    for await (const chunk of iterator) {
      if (chunk.type === "directive") {
        content += stringifyChunk(result, chunk);
      } else {
        content += chunk;
      }
    }
    return markHTMLString(content);
  }
  return fallback;
}

/**
 * shortdash - https://github.com/bibig/node-shorthash
 *
 * @license
 *
 * (The MIT License)
 *
 * Copyright (c) 2013 Bibig <bibig@me.com>
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */
const dictionary$1 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXY";
const binary$1 = dictionary$1.length;
function bitwise$1(str) {
  let hash = 0;
  if (str.length === 0)
    return hash;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash = (hash << 5) - hash + ch;
    hash = hash & hash;
  }
  return hash;
}
function shorthash$1(text) {
  let num;
  let result = "";
  let integer = bitwise$1(text);
  const sign = integer < 0 ? "Z" : "";
  integer = Math.abs(integer);
  while (integer >= binary$1) {
    num = integer % binary$1;
    integer = Math.floor(integer / binary$1);
    result = dictionary$1[num] + result;
  }
  if (integer > 0) {
    result = dictionary$1[integer] + result;
  }
  return sign + result;
}

const voidElementNames = /^(area|base|br|col|command|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)$/i;
const htmlBooleanAttributes = /^(allowfullscreen|async|autofocus|autoplay|controls|default|defer|disabled|disablepictureinpicture|disableremoteplayback|formnovalidate|hidden|loop|nomodule|novalidate|open|playsinline|readonly|required|reversed|scoped|seamless|itemscope)$/i;
const htmlEnumAttributes = /^(contenteditable|draggable|spellcheck|value)$/i;
const svgEnumAttributes = /^(autoReverse|externalResourcesRequired|focusable|preserveAlpha)$/i;
const STATIC_DIRECTIVES = /* @__PURE__ */ new Set(["set:html", "set:text"]);
const toIdent = (k) => k.trim().replace(/(?:(?<!^)\b\w|\s+|[^\w]+)/g, (match, index) => {
  if (/[^\w]|\s/.test(match))
    return "";
  return index === 0 ? match : match.toUpperCase();
});
const toAttributeString = (value, shouldEscape = true) => shouldEscape ? String(value).replace(/&/g, "&#38;").replace(/"/g, "&#34;") : value;
const kebab = (k) => k.toLowerCase() === k ? k : k.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
const toStyleString = (obj) => Object.entries(obj).map(([k, v]) => `${kebab(k)}:${v}`).join(";");
function defineScriptVars(vars) {
  let output = "";
  for (const [key, value] of Object.entries(vars)) {
    output += `let ${toIdent(key)} = ${JSON.stringify(value)};
`;
  }
  return markHTMLString(output);
}
function formatList(values) {
  if (values.length === 1) {
    return values[0];
  }
  return `${values.slice(0, -1).join(", ")} or ${values[values.length - 1]}`;
}
function addAttribute(value, key, shouldEscape = true) {
  if (value == null) {
    return "";
  }
  if (value === false) {
    if (htmlEnumAttributes.test(key) || svgEnumAttributes.test(key)) {
      return markHTMLString(` ${key}="false"`);
    }
    return "";
  }
  if (STATIC_DIRECTIVES.has(key)) {
    console.warn(`[astro] The "${key}" directive cannot be applied dynamically at runtime. It will not be rendered as an attribute.

Make sure to use the static attribute syntax (\`${key}={value}\`) instead of the dynamic spread syntax (\`{...{ "${key}": value }}\`).`);
    return "";
  }
  if (key === "class:list") {
    const listValue = toAttributeString(serializeListValue(value));
    if (listValue === "") {
      return "";
    }
    return markHTMLString(` ${key.slice(0, -5)}="${listValue}"`);
  }
  if (key === "style" && !(value instanceof HTMLString) && typeof value === "object") {
    return markHTMLString(` ${key}="${toStyleString(value)}"`);
  }
  if (key === "className") {
    return markHTMLString(` class="${toAttributeString(value, shouldEscape)}"`);
  }
  if (value === true && (key.startsWith("data-") || htmlBooleanAttributes.test(key))) {
    return markHTMLString(` ${key}`);
  } else {
    return markHTMLString(` ${key}="${toAttributeString(value, shouldEscape)}"`);
  }
}
function internalSpreadAttributes(values, shouldEscape = true) {
  let output = "";
  for (const [key, value] of Object.entries(values)) {
    output += addAttribute(value, key, shouldEscape);
  }
  return markHTMLString(output);
}
function renderElement$1(name, { props: _props, children = "" }, shouldEscape = true) {
  const { lang: _, "data-astro-id": astroId, "define:vars": defineVars, ...props } = _props;
  if (defineVars) {
    if (name === "style") {
      delete props["is:global"];
      delete props["is:scoped"];
    }
    if (name === "script") {
      delete props.hoist;
      children = defineScriptVars(defineVars) + "\n" + children;
    }
  }
  if ((children == null || children == "") && voidElementNames.test(name)) {
    return `<${name}${internalSpreadAttributes(props, shouldEscape)} />`;
  }
  return `<${name}${internalSpreadAttributes(props, shouldEscape)}>${children}</${name}>`;
}

function componentIsHTMLElement(Component) {
  return typeof HTMLElement !== "undefined" && HTMLElement.isPrototypeOf(Component);
}
async function renderHTMLElement(result, constructor, props, slots) {
  const name = getHTMLElementName(constructor);
  let attrHTML = "";
  for (const attr in props) {
    attrHTML += ` ${attr}="${toAttributeString(await props[attr])}"`;
  }
  return markHTMLString(
    `<${name}${attrHTML}>${await renderSlot(result, slots == null ? void 0 : slots.default)}</${name}>`
  );
}
function getHTMLElementName(constructor) {
  const definedName = customElements.getName(constructor);
  if (definedName)
    return definedName;
  const assignedName = constructor.name.replace(/^HTML|Element$/g, "").replace(/[A-Z]/g, "-$&").toLowerCase().replace(/^-/, "html-");
  return assignedName;
}

const rendererAliases = /* @__PURE__ */ new Map([["solid", "solid-js"]]);
function guessRenderers(componentUrl) {
  const extname = componentUrl == null ? void 0 : componentUrl.split(".").pop();
  switch (extname) {
    case "svelte":
      return ["@astrojs/svelte"];
    case "vue":
      return ["@astrojs/vue"];
    case "jsx":
    case "tsx":
      return ["@astrojs/react", "@astrojs/preact"];
    default:
      return ["@astrojs/react", "@astrojs/preact", "@astrojs/vue", "@astrojs/svelte"];
  }
}
function getComponentType(Component) {
  if (Component === Fragment) {
    return "fragment";
  }
  if (Component && typeof Component === "object" && Component["astro:html"]) {
    return "html";
  }
  if (isAstroComponentFactory(Component)) {
    return "astro-factory";
  }
  return "unknown";
}
async function renderComponent(result, displayName, Component, _props, slots = {}) {
  var _a;
  Component = await Component;
  switch (getComponentType(Component)) {
    case "fragment": {
      const children2 = await renderSlot(result, slots == null ? void 0 : slots.default);
      if (children2 == null) {
        return children2;
      }
      return markHTMLString(children2);
    }
    case "html": {
      const children2 = {};
      if (slots) {
        await Promise.all(
          Object.entries(slots).map(
            ([key, value]) => renderSlot(result, value).then((output) => {
              children2[key] = output;
            })
          )
        );
      }
      const html2 = Component.render({ slots: children2 });
      return markHTMLString(html2);
    }
    case "astro-factory": {
      async function* renderAstroComponentInline() {
        let iterable = await renderToIterable(result, Component, displayName, _props, slots);
        yield* iterable;
      }
      return renderAstroComponentInline();
    }
  }
  if (!Component && !_props["client:only"]) {
    throw new Error(
      `Unable to render ${displayName} because it is ${Component}!
Did you forget to import the component or is it possible there is a typo?`
    );
  }
  const { renderers } = result._metadata;
  const metadata = { displayName };
  const { hydration, isPage, props } = extractDirectives(_props);
  let html = "";
  let attrs = void 0;
  if (hydration) {
    metadata.hydrate = hydration.directive;
    metadata.hydrateArgs = hydration.value;
    metadata.componentExport = hydration.componentExport;
    metadata.componentUrl = hydration.componentUrl;
  }
  const probableRendererNames = guessRenderers(metadata.componentUrl);
  if (Array.isArray(renderers) && renderers.length === 0 && typeof Component !== "string" && !componentIsHTMLElement(Component)) {
    const message = `Unable to render ${metadata.displayName}!

There are no \`integrations\` set in your \`astro.config.mjs\` file.
Did you mean to add ${formatList(probableRendererNames.map((r) => "`" + r + "`"))}?`;
    throw new Error(message);
  }
  const children = {};
  if (slots) {
    await Promise.all(
      Object.entries(slots).map(
        ([key, value]) => renderSlot(result, value).then((output) => {
          children[key] = output;
        })
      )
    );
  }
  let renderer;
  if (metadata.hydrate !== "only") {
    if (Component && Component[Renderer]) {
      const rendererName = Component[Renderer];
      renderer = renderers.find(({ name }) => name === rendererName);
    }
    if (!renderer) {
      let error;
      for (const r of renderers) {
        try {
          if (await r.ssr.check.call({ result }, Component, props, children)) {
            renderer = r;
            break;
          }
        } catch (e) {
          error ?? (error = e);
        }
      }
      if (!renderer && error) {
        throw error;
      }
    }
    if (!renderer && typeof HTMLElement === "function" && componentIsHTMLElement(Component)) {
      const output = renderHTMLElement(result, Component, _props, slots);
      return output;
    }
  } else {
    if (metadata.hydrateArgs) {
      const passedName = metadata.hydrateArgs;
      const rendererName = rendererAliases.has(passedName) ? rendererAliases.get(passedName) : passedName;
      renderer = renderers.find(
        ({ name }) => name === `@astrojs/${rendererName}` || name === rendererName
      );
    }
    if (!renderer && renderers.length === 1) {
      renderer = renderers[0];
    }
    if (!renderer) {
      const extname = (_a = metadata.componentUrl) == null ? void 0 : _a.split(".").pop();
      renderer = renderers.filter(
        ({ name }) => name === `@astrojs/${extname}` || name === extname
      )[0];
    }
  }
  if (!renderer) {
    if (metadata.hydrate === "only") {
      throw new Error(`Unable to render ${metadata.displayName}!

Using the \`client:only\` hydration strategy, Astro needs a hint to use the correct renderer.
Did you mean to pass <${metadata.displayName} client:only="${probableRendererNames.map((r) => r.replace("@astrojs/", "")).join("|")}" />
`);
    } else if (typeof Component !== "string") {
      const matchingRenderers = renderers.filter((r) => probableRendererNames.includes(r.name));
      const plural = renderers.length > 1;
      if (matchingRenderers.length === 0) {
        throw new Error(`Unable to render ${metadata.displayName}!

There ${plural ? "are" : "is"} ${renderers.length} renderer${plural ? "s" : ""} configured in your \`astro.config.mjs\` file,
but ${plural ? "none were" : "it was not"} able to server-side render ${metadata.displayName}.

Did you mean to enable ${formatList(probableRendererNames.map((r) => "`" + r + "`"))}?`);
      } else if (matchingRenderers.length === 1) {
        renderer = matchingRenderers[0];
        ({ html, attrs } = await renderer.ssr.renderToStaticMarkup.call(
          { result },
          Component,
          props,
          children,
          metadata
        ));
      } else {
        throw new Error(`Unable to render ${metadata.displayName}!

This component likely uses ${formatList(probableRendererNames)},
but Astro encountered an error during server-side rendering.

Please ensure that ${metadata.displayName}:
1. Does not unconditionally access browser-specific globals like \`window\` or \`document\`.
   If this is unavoidable, use the \`client:only\` hydration directive.
2. Does not conditionally return \`null\` or \`undefined\` when rendered on the server.

If you're still stuck, please open an issue on GitHub or join us at https://astro.build/chat.`);
      }
    }
  } else {
    if (metadata.hydrate === "only") {
      html = await renderSlot(result, slots == null ? void 0 : slots.fallback);
    } else {
      ({ html, attrs } = await renderer.ssr.renderToStaticMarkup.call(
        { result },
        Component,
        props,
        children,
        metadata
      ));
    }
  }
  if (renderer && !renderer.clientEntrypoint && renderer.name !== "@astrojs/lit" && metadata.hydrate) {
    throw new Error(
      `${metadata.displayName} component has a \`client:${metadata.hydrate}\` directive, but no client entrypoint was provided by ${renderer.name}!`
    );
  }
  if (!html && typeof Component === "string") {
    const childSlots = Object.values(children).join("");
    const iterable = renderAstroComponent(
      await renderTemplate`<${Component}${internalSpreadAttributes(props)}${markHTMLString(
        childSlots === "" && voidElementNames.test(Component) ? `/>` : `>${childSlots}</${Component}>`
      )}`
    );
    html = "";
    for await (const chunk of iterable) {
      html += chunk;
    }
  }
  if (!hydration) {
    if (isPage || (renderer == null ? void 0 : renderer.name) === "astro:jsx") {
      return html;
    }
    return markHTMLString(html.replace(/\<\/?astro-slot\>/g, ""));
  }
  const astroId = shorthash$1(
    `<!--${metadata.componentExport.value}:${metadata.componentUrl}-->
${html}
${serializeProps(
      props,
      metadata
    )}`
  );
  const island = await generateHydrateScript(
    { renderer, result, astroId, props, attrs },
    metadata
  );
  let unrenderedSlots = [];
  if (html) {
    if (Object.keys(children).length > 0) {
      for (const key of Object.keys(children)) {
        if (!html.includes(key === "default" ? `<astro-slot>` : `<astro-slot name="${key}">`)) {
          unrenderedSlots.push(key);
        }
      }
    }
  } else {
    unrenderedSlots = Object.keys(children);
  }
  const template = unrenderedSlots.length > 0 ? unrenderedSlots.map(
    (key) => `<template data-astro-template${key !== "default" ? `="${key}"` : ""}>${children[key]}</template>`
  ).join("") : "";
  island.children = `${html ?? ""}${template}`;
  if (island.children) {
    island.props["await-children"] = "";
  }
  async function* renderAll() {
    yield { type: "directive", hydration, result };
    yield markHTMLString(renderElement$1("astro-island", island, false));
  }
  return renderAll();
}

const uniqueElements = (item, index, all) => {
  const props = JSON.stringify(item.props);
  const children = item.children;
  return index === all.findIndex((i) => JSON.stringify(i.props) === props && i.children == children);
};
const alreadyHeadRenderedResults = /* @__PURE__ */ new WeakSet();
function renderHead(result) {
  alreadyHeadRenderedResults.add(result);
  const styles = Array.from(result.styles).filter(uniqueElements).map((style) => renderElement$1("style", style));
  result.styles.clear();
  const scripts = Array.from(result.scripts).filter(uniqueElements).map((script, i) => {
    return renderElement$1("script", script, false);
  });
  const links = Array.from(result.links).filter(uniqueElements).map((link) => renderElement$1("link", link, false));
  return markHTMLString(links.join("\n") + styles.join("\n") + scripts.join("\n"));
}
async function* maybeRenderHead(result) {
  if (alreadyHeadRenderedResults.has(result)) {
    return;
  }
  yield renderHead(result);
}

typeof process === "object" && Object.prototype.toString.call(process) === "[object process]";

new TextEncoder();

function createComponent(cb) {
  cb.isAstroComponentFactory = true;
  return cb;
}
function spreadAttributes(values, _name, { class: scopedClassName } = {}) {
  let output = "";
  if (scopedClassName) {
    if (typeof values.class !== "undefined") {
      values.class += ` ${scopedClassName}`;
    } else if (typeof values["class:list"] !== "undefined") {
      values["class:list"] = [values["class:list"], scopedClassName];
    } else {
      values.class = scopedClassName;
    }
  }
  for (const [key, value] of Object.entries(values)) {
    output += addAttribute(value, key, true);
  }
  return markHTMLString(output);
}

const AstroJSX = "astro:jsx";
const Empty = Symbol("empty");
const toSlotName = (str) => str.trim().replace(/[-_]([a-z])/g, (_, w) => w.toUpperCase());
function isVNode(vnode) {
  return vnode && typeof vnode === "object" && vnode[AstroJSX];
}
function transformSlots(vnode) {
  if (typeof vnode.type === "string")
    return vnode;
  const slots = {};
  if (isVNode(vnode.props.children)) {
    const child = vnode.props.children;
    if (!isVNode(child))
      return;
    if (!("slot" in child.props))
      return;
    const name = toSlotName(child.props.slot);
    slots[name] = [child];
    slots[name]["$$slot"] = true;
    delete child.props.slot;
    delete vnode.props.children;
  }
  if (Array.isArray(vnode.props.children)) {
    vnode.props.children = vnode.props.children.map((child) => {
      if (!isVNode(child))
        return child;
      if (!("slot" in child.props))
        return child;
      const name = toSlotName(child.props.slot);
      if (Array.isArray(slots[name])) {
        slots[name].push(child);
      } else {
        slots[name] = [child];
        slots[name]["$$slot"] = true;
      }
      delete child.props.slot;
      return Empty;
    }).filter((v) => v !== Empty);
  }
  Object.assign(vnode.props, slots);
}
function markRawChildren(child) {
  if (typeof child === "string")
    return markHTMLString(child);
  if (Array.isArray(child))
    return child.map((c) => markRawChildren(c));
  return child;
}
function transformSetDirectives(vnode) {
  if (!("set:html" in vnode.props || "set:text" in vnode.props))
    return;
  if ("set:html" in vnode.props) {
    const children = markRawChildren(vnode.props["set:html"]);
    delete vnode.props["set:html"];
    Object.assign(vnode.props, { children });
    return;
  }
  if ("set:text" in vnode.props) {
    const children = vnode.props["set:text"];
    delete vnode.props["set:text"];
    Object.assign(vnode.props, { children });
    return;
  }
}
function createVNode(type, props) {
  const vnode = {
    [AstroJSX]: true,
    type,
    props: props ?? {}
  };
  transformSetDirectives(vnode);
  transformSlots(vnode);
  return vnode;
}

const ClientOnlyPlaceholder = "astro-client-only";
const skipAstroJSXCheck = /* @__PURE__ */ new WeakSet();
let originalConsoleError;
let consoleFilterRefs = 0;
async function renderJSX(result, vnode) {
  switch (true) {
    case vnode instanceof HTMLString:
      if (vnode.toString().trim() === "") {
        return "";
      }
      return vnode;
    case typeof vnode === "string":
      return markHTMLString(escapeHTML(vnode));
    case (!vnode && vnode !== 0):
      return "";
    case Array.isArray(vnode):
      return markHTMLString(
        (await Promise.all(vnode.map((v) => renderJSX(result, v)))).join("")
      );
  }
  if (isVNode(vnode)) {
    switch (true) {
      case vnode.type === Symbol.for("astro:fragment"):
        return renderJSX(result, vnode.props.children);
      case vnode.type.isAstroComponentFactory: {
        let props = {};
        let slots = {};
        for (const [key, value] of Object.entries(vnode.props ?? {})) {
          if (key === "children" || value && typeof value === "object" && value["$$slot"]) {
            slots[key === "children" ? "default" : key] = () => renderJSX(result, value);
          } else {
            props[key] = value;
          }
        }
        return markHTMLString(await renderToString(result, vnode.type, props, slots));
      }
      case (!vnode.type && vnode.type !== 0):
        return "";
      case (typeof vnode.type === "string" && vnode.type !== ClientOnlyPlaceholder):
        return markHTMLString(await renderElement(result, vnode.type, vnode.props ?? {}));
    }
    if (vnode.type) {
      let extractSlots2 = function(child) {
        if (Array.isArray(child)) {
          return child.map((c) => extractSlots2(c));
        }
        if (!isVNode(child)) {
          _slots.default.push(child);
          return;
        }
        if ("slot" in child.props) {
          _slots[child.props.slot] = [..._slots[child.props.slot] ?? [], child];
          delete child.props.slot;
          return;
        }
        _slots.default.push(child);
      };
      if (typeof vnode.type === "function" && vnode.type["astro:renderer"]) {
        skipAstroJSXCheck.add(vnode.type);
      }
      if (typeof vnode.type === "function" && vnode.props["server:root"]) {
        const output2 = await vnode.type(vnode.props ?? {});
        return await renderJSX(result, output2);
      }
      if (typeof vnode.type === "function" && !skipAstroJSXCheck.has(vnode.type)) {
        useConsoleFilter();
        try {
          const output2 = await vnode.type(vnode.props ?? {});
          if (output2 && output2[AstroJSX]) {
            return await renderJSX(result, output2);
          } else if (!output2) {
            return await renderJSX(result, output2);
          }
        } catch (e) {
          skipAstroJSXCheck.add(vnode.type);
        } finally {
          finishUsingConsoleFilter();
        }
      }
      const { children = null, ...props } = vnode.props ?? {};
      const _slots = {
        default: []
      };
      extractSlots2(children);
      for (const [key, value] of Object.entries(props)) {
        if (value["$$slot"]) {
          _slots[key] = value;
          delete props[key];
        }
      }
      const slotPromises = [];
      const slots = {};
      for (const [key, value] of Object.entries(_slots)) {
        slotPromises.push(
          renderJSX(result, value).then((output2) => {
            if (output2.toString().trim().length === 0)
              return;
            slots[key] = () => output2;
          })
        );
      }
      await Promise.all(slotPromises);
      let output;
      if (vnode.type === ClientOnlyPlaceholder && vnode.props["client:only"]) {
        output = await renderComponent(
          result,
          vnode.props["client:display-name"] ?? "",
          null,
          props,
          slots
        );
      } else {
        output = await renderComponent(
          result,
          typeof vnode.type === "function" ? vnode.type.name : vnode.type,
          vnode.type,
          props,
          slots
        );
      }
      if (typeof output !== "string" && Symbol.asyncIterator in output) {
        let body = "";
        for await (const chunk of output) {
          let html = stringifyChunk(result, chunk);
          body += html;
        }
        return markHTMLString(body);
      } else {
        return markHTMLString(output);
      }
    }
  }
  return markHTMLString(`${vnode}`);
}
async function renderElement(result, tag, { children, ...props }) {
  return markHTMLString(
    `<${tag}${spreadAttributes(props)}${markHTMLString(
      (children == null || children == "") && voidElementNames.test(tag) ? `/>` : `>${children == null ? "" : await renderJSX(result, children)}</${tag}>`
    )}`
  );
}
function useConsoleFilter() {
  consoleFilterRefs++;
  if (!originalConsoleError) {
    originalConsoleError = console.error;
    try {
      console.error = filteredConsoleError;
    } catch (error) {
    }
  }
}
function finishUsingConsoleFilter() {
  consoleFilterRefs--;
}
function filteredConsoleError(msg, ...rest) {
  if (consoleFilterRefs > 0 && typeof msg === "string") {
    const isKnownReactHookError = msg.includes("Warning: Invalid hook call.") && msg.includes("https://reactjs.org/link/invalid-hook-call");
    if (isKnownReactHookError)
      return;
  }
  originalConsoleError(msg, ...rest);
}

const slotName = (str) => str.trim().replace(/[-_]([a-z])/g, (_, w) => w.toUpperCase());
async function check(Component, props, { default: children = null, ...slotted } = {}) {
  if (typeof Component !== "function")
    return false;
  const slots = {};
  for (const [key, value] of Object.entries(slotted)) {
    const name = slotName(key);
    slots[name] = value;
  }
  try {
    const result = await Component({ ...props, ...slots, children });
    return result[AstroJSX];
  } catch (e) {
  }
  return false;
}
async function renderToStaticMarkup(Component, props = {}, { default: children = null, ...slotted } = {}) {
  const slots = {};
  for (const [key, value] of Object.entries(slotted)) {
    const name = slotName(key);
    slots[name] = value;
  }
  const { result } = this;
  const html = await renderJSX(result, createVNode(Component, { ...props, ...slots, children }));
  return { html };
}
var server_default = {
  check,
  renderToStaticMarkup
};

function isOutputFormat(value) {
  return ["avif", "jpeg", "png", "webp"].includes(value);
}
function isAspectRatioString(value) {
  return /^\d*:\d*$/.test(value);
}
function parseAspectRatio(aspectRatio) {
  if (!aspectRatio) {
    return void 0;
  }
  if (typeof aspectRatio === "number") {
    return aspectRatio;
  } else {
    const [width, height] = aspectRatio.split(":");
    return parseInt(width) / parseInt(height);
  }
}
function isSSRService(service) {
  return "transform" in service;
}

class SharpService {
  async getImageAttributes(transform) {
    const { width, height, src, format, quality, aspectRatio, fit, position, background, ...rest } = transform;
    return {
      ...rest,
      width,
      height
    };
  }
  serializeTransform(transform) {
    const searchParams = new URLSearchParams();
    if (transform.quality) {
      searchParams.append("q", transform.quality.toString());
    }
    if (transform.format) {
      searchParams.append("f", transform.format);
    }
    if (transform.width) {
      searchParams.append("w", transform.width.toString());
    }
    if (transform.height) {
      searchParams.append("h", transform.height.toString());
    }
    if (transform.aspectRatio) {
      searchParams.append("ar", transform.aspectRatio.toString());
    }
    if (transform.fit) {
      searchParams.append("fit", transform.fit);
    }
    if (transform.background) {
      searchParams.append("bg", transform.background);
    }
    if (transform.position) {
      searchParams.append("p", encodeURI(transform.position));
    }
    return { searchParams };
  }
  parseTransform(searchParams) {
    let transform = { src: searchParams.get("href") };
    if (searchParams.has("q")) {
      transform.quality = parseInt(searchParams.get("q"));
    }
    if (searchParams.has("f")) {
      const format = searchParams.get("f");
      if (isOutputFormat(format)) {
        transform.format = format;
      }
    }
    if (searchParams.has("w")) {
      transform.width = parseInt(searchParams.get("w"));
    }
    if (searchParams.has("h")) {
      transform.height = parseInt(searchParams.get("h"));
    }
    if (searchParams.has("ar")) {
      const ratio = searchParams.get("ar");
      if (isAspectRatioString(ratio)) {
        transform.aspectRatio = ratio;
      } else {
        transform.aspectRatio = parseFloat(ratio);
      }
    }
    if (searchParams.has("fit")) {
      transform.fit = searchParams.get("fit");
    }
    if (searchParams.has("p")) {
      transform.position = decodeURI(searchParams.get("p"));
    }
    if (searchParams.has("bg")) {
      transform.background = searchParams.get("bg");
    }
    return transform;
  }
  async transform(inputBuffer, transform) {
    const sharpImage = sharp$1(inputBuffer, { failOnError: false, pages: -1 });
    sharpImage.rotate();
    if (transform.width || transform.height) {
      const width = transform.width && Math.round(transform.width);
      const height = transform.height && Math.round(transform.height);
      sharpImage.resize({
        width,
        height,
        fit: transform.fit,
        position: transform.position,
        background: transform.background
      });
    }
    if (transform.background) {
      sharpImage.flatten({ background: transform.background });
    }
    if (transform.format) {
      sharpImage.toFormat(transform.format, { quality: transform.quality });
    }
    const { data, info } = await sharpImage.toBuffer({ resolveWithObject: true });
    return {
      data,
      format: info.format
    };
  }
}
const service = new SharpService();
var sharp_default = service;

const sharp = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: sharp_default
}, Symbol.toStringTag, { value: 'Module' }));

const fnv1a52 = (str) => {
  const len = str.length;
  let i = 0, t0 = 0, v0 = 8997, t1 = 0, v1 = 33826, t2 = 0, v2 = 40164, t3 = 0, v3 = 52210;
  while (i < len) {
    v0 ^= str.charCodeAt(i++);
    t0 = v0 * 435;
    t1 = v1 * 435;
    t2 = v2 * 435;
    t3 = v3 * 435;
    t2 += v0 << 8;
    t3 += v1 << 8;
    t1 += t0 >>> 16;
    v0 = t0 & 65535;
    t2 += t1 >>> 16;
    v1 = t1 & 65535;
    v3 = t3 + (t2 >>> 16) & 65535;
    v2 = t2 & 65535;
  }
  return (v3 & 15) * 281474976710656 + v2 * 4294967296 + v1 * 65536 + (v0 ^ v3 >> 4);
};
const etag = (payload, weak = false) => {
  const prefix = weak ? 'W/"' : '"';
  return prefix + fnv1a52(payload).toString(36) + payload.length.toString(36) + '"';
};

/**
 * shortdash - https://github.com/bibig/node-shorthash
 *
 * @license
 *
 * (The MIT License)
 *
 * Copyright (c) 2013 Bibig <bibig@me.com>
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */
const dictionary = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXY";
const binary = dictionary.length;
function bitwise(str) {
  let hash = 0;
  if (str.length === 0)
    return hash;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash = (hash << 5) - hash + ch;
    hash = hash & hash;
  }
  return hash;
}
function shorthash(text) {
  let num;
  let result = "";
  let integer = bitwise(text);
  const sign = integer < 0 ? "Z" : "";
  integer = Math.abs(integer);
  while (integer >= binary) {
    num = integer % binary;
    integer = Math.floor(integer / binary);
    result = dictionary[num] + result;
  }
  if (integer > 0) {
    result = dictionary[integer] + result;
  }
  return sign + result;
}

function isRemoteImage(src) {
  return /^http(s?):\/\//.test(src);
}
function removeQueryString(src) {
  const index = src.lastIndexOf("?");
  return index > 0 ? src.substring(0, index) : src;
}
function extname(src, format) {
  const index = src.lastIndexOf(".");
  if (index <= 0) {
    return "";
  }
  return src.substring(index);
}
function removeExtname(src) {
  const index = src.lastIndexOf(".");
  if (index <= 0) {
    return src;
  }
  return src.substring(0, index);
}
function basename(src) {
  return src.replace(/^.*[\\\/]/, "");
}
function propsToFilename(transform) {
  let filename = removeQueryString(transform.src);
  filename = basename(filename);
  const ext = extname(filename);
  filename = removeExtname(filename);
  const outputExt = transform.format ? `.${transform.format}` : ext;
  return `/${filename}_${shorthash(JSON.stringify(transform))}${outputExt}`;
}
function prependForwardSlash(path) {
  return path[0] === "/" ? path : "/" + path;
}
function trimSlashes(path) {
  return path.replace(/^\/|\/$/g, "");
}
function isString(path) {
  return typeof path === "string" || path instanceof String;
}
function joinPaths(...paths) {
  return paths.filter(isString).map(trimSlashes).join("/");
}

async function loadRemoteImage$1(src) {
  try {
    const res = await fetch(src);
    if (!res.ok) {
      return void 0;
    }
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return void 0;
  }
}
const get$1 = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const transform = sharp_default.parseTransform(url.searchParams);
    let inputBuffer = void 0;
    const sourceUrl = isRemoteImage(transform.src) ? new URL(transform.src) : new URL(transform.src, url.origin);
    inputBuffer = await loadRemoteImage$1(sourceUrl);
    if (!inputBuffer) {
      return new Response("Not Found", { status: 404 });
    }
    const { data, format } = await sharp_default.transform(inputBuffer, transform);
    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": mime.getType(format) || "",
        "Cache-Control": "public, max-age=31536000",
        ETag: etag(data.toString()),
        Date: new Date().toUTCString()
      }
    });
  } catch (err) {
    return new Response(`Server Error: ${err}`, { status: 500 });
  }
};

const _page0 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  get: get$1
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata$e = createMetadata("/@fs/Volumes/Cache/repos/codos-dio/src/components/content-section.astro", { modules: [], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$j = createAstro("/@fs/Volumes/Cache/repos/codos-dio/src/components/content-section.astro", "https://dio.codos.co.nz/", "file:///Volumes/Cache/repos/codos-dio/");
const $$ContentSection = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$j, $$props, $$slots);
  Astro2.self = $$ContentSection;
  const { title, id } = Astro2.props;
  return renderTemplate`${maybeRenderHead($$result)}<section${addAttribute(id, "id")} class="flex flex-col items-center gap-4 space-y-8 scroll-mt-24">
  <div class="flex flex-col items-center gap-4">
    ${renderSlot($$result, $$slots["eyebrow"])}
    <h2 class="text-6xl font-extrabold tracking-tight text-center gradient-text">
      ${title}
    </h2>
  </div>
  <p class="max-w-xl text-2xl font-extrabold text-center">
    ${renderSlot($$result, $$slots["lead"])}
  </p>
  ${renderSlot($$result, $$slots["default"])}
</section>`;
});

const $$file$e = "/Volumes/Cache/repos/codos-dio/src/components/content-section.astro";
const $$url$e = undefined;

const $$module1$5 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  $$metadata: $$metadata$e,
  default: $$ContentSection,
  file: $$file$e,
  url: $$url$e
}, Symbol.toStringTag, { value: 'Module' }));

const __vite_glob_1_0 = "<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 190 190\">\n  <path\n    fill=\"currentColor\"\n    d=\"M95 143V79l33-33v65l-33 32Zm-65 0 32 33v-65H46\"\n  />\n  <path\n    fill=\"currentColor\"\n    d=\"M62 111V46l33-32v65l-33 32Zm66 65v-65l32-32v64l-32 33Zm-98-33V79l32 32\"\n  />\n</svg>\n";

const __vite_glob_1_1 = "<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 190 190\">\n  <path\n    fill=\"currentColor\"\n    d=\"m101 61 24-10c6-2 12-3 17-2 4 0 7 1 9 4 1 2 2 5 1 9l-6 16-10 13a181 181 0 0 0-35-30ZM54 91l-9-13c-4-6-6-11-7-16 0-4 0-7 2-9 2-3 4-4 9-4 4-1 10 0 17 2l24 10a190 190 0 0 0-36 30Z\"\n  />\n  <path\n    fill=\"currentColor\"\n    fill-rule=\"evenodd\"\n    d=\"M58 95a174 174 0 0 1 37-30 182 182 0 0 1 37 30 174 174 0 0 1-37 30 182 182 0 0 1-37-30Zm37 13a13 13 0 1 0 0-26 13 13 0 0 0 0 26Z\"\n    clip-rule=\"evenodd\"\n  />\n  <path\n    fill=\"currentColor\"\n    d=\"m54 99-9 13c-4 6-6 11-7 16 0 4 0 7 2 9 2 3 4 4 9 4 4 1 10 0 17-2l24-10a191 191 0 0 1-36-30Zm47 30 24 10c6 2 12 3 17 2 4 0 7-1 9-4 1-2 2-5 1-9l-6-16-10-13a181 181 0 0 1-35 30Z\"\n  />\n  <path\n    fill=\"currentColor\"\n    fill-rule=\"evenodd\"\n    d=\"M178 48 95 0 13 48v95l82 47 83-47V48ZM95 58c10-6 20-10 28-13 7-2 14-3 19-2 6 0 10 2 13 6s4 9 3 14c-1 6-4 12-7 18l-11 14 11 14c3 6 6 12 7 18 1 5 0 10-3 14s-7 6-13 6c-5 1-12 0-19-2-8-3-18-7-28-13-10 6-19 10-28 13-7 2-13 3-19 2-5 0-10-2-13-6s-3-9-2-14c1-6 3-12 7-18l10-14-10-14c-4-6-6-12-7-18-1-5-1-10 2-14s8-6 13-6c6-1 12 0 19 2 9 3 18 7 28 13Z\"\n    clip-rule=\"evenodd\"\n  />\n</svg>\n";

const __vite_glob_1_2 = "<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 190 190\">\n  <path\n    fill=\"currentColor\"\n    d=\"M190 95c0-13-16-25-40-32 6-25 3-45-8-51l-8-2v9l4 1c5 3 8 14 6 29l-2 11-25-4c-5-7-10-14-16-19 13-12 25-18 33-18v-9c-11 0-25 8-39 21-14-13-28-21-39-21v9c8 0 20 6 33 18L73 56l-25 4-2-11c-2-15 1-26 6-29l4-1v-9l-9 2c-10 7-13 26-7 51C16 70 0 82 0 95c0 12 16 24 40 32-6 24-3 44 8 50 2 2 5 2 8 2 11 0 25-7 39-21 14 14 28 21 39 21l9-2c10-6 13-26 7-51 24-7 40-19 40-31Zm-50-26-6 15a184 184 0 0 0-10-18l16 3Zm-18 41-9 15a202 202 0 0 1-35 0 213 213 0 0 1-18-30 202 202 0 0 1 17-31 202 202 0 0 1 35 0 213 213 0 0 1 18 31l-8 15Zm12-5 6 15-16 4a212 212 0 0 0 10-19Zm-39 41-11-12a240 240 0 0 0 22 0l-11 12Zm-29-22-16-4 6-15a183 183 0 0 0 10 19Zm29-81 11 12a240 240 0 0 0-22 0l11-12ZM66 66a214 214 0 0 0-10 18l-6-15 16-3Zm-35 48c-14-6-22-13-22-19s8-14 22-20l11-4 9 24-9 23-11-4Zm21 56c-5-3-8-15-6-30l2-11 25 4c5 7 10 14 16 19-13 12-25 19-33 19l-4-1Zm92-30c2 15-1 26-6 29l-4 1c-8 0-20-6-33-18 6-5 11-12 16-19l25-4 2 11Zm15-26-11 4-9-23 9-24 11 4c14 6 22 14 22 20s-9 13-22 19Z\"\n  />\n  <path fill=\"currentColor\" d=\"M95 112a18 18 0 1 0 0-35 18 18 0 0 0 0 35Z\" />\n</svg>\n";

const __vite_glob_1_3 = "<svg viewBox=\"0 0 190 190\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n  <path\n    d=\"M127.61 135.052C121.624 127.573 113.542 122.052 104.399 119.195C95.2561 116.338 85.4683 116.275 76.2893 119.014L10 140.398C10 140.398 66.6667 183.165 110.503 172.473L113.711 171.404C131.887 166.058 138.302 148.951 127.61 135.052Z\"\n    fill=\"currentColor\"\n    fill-opacity=\"0.85\"\n  />\n  <path\n    d=\"M125.783 81.7735C134.926 84.6307 143.008 90.152 148.994 97.6304C154.34 106.184 155.409 114.737 151.132 122.222L129.748 160.712L129.314 160.639C134.288 153.175 134.123 143.518 127.61 135.052C121.624 127.573 113.542 122.052 104.399 119.195C95.2561 116.338 85.4683 116.275 76.2893 119.014L10 140.398L31.3836 102.976L97.673 81.5926C106.852 78.8533 116.64 78.9163 125.783 81.7735Z\"\n    fill=\"currentColor\"\n    fill-opacity=\"0.65\"\n  />\n  <path\n    d=\"M57.0441 50.5863L61.3208 49.5171C104.088 39.8945 160.755 81.5926 160.755 81.5926L139.663 88.7366C135.466 85.6958 130.783 83.3362 125.783 81.7735C116.64 78.9163 106.852 78.8533 97.673 81.5926L51.96 96.3387C48.5484 93.9348 45.5491 91.1335 43.1447 88.0077C33.5221 73.0392 38.868 55.9322 57.0441 50.5863Z\"\n    fill=\"currentColor\"\n    fill-opacity=\"0.45\"\n  />\n  <path\n    d=\"M79.4969 17.4417C123.333 7.81904 180 49.5172 180 49.5172L160.755 81.5926C160.755 81.5926 104.088 39.8945 61.3208 49.5172L57.0441 50.5863C51.0678 52.344 46.4787 55.3732 43.3525 59.1798C43.2832 59.1664 43.2139 59.1531 43.1447 59.1398L59.1824 31.3411L61.3208 28.1335C64.5283 23.8568 69.8742 20.6492 76.2893 18.5109L79.4969 17.4417Z\"\n    fill=\"currentColor\"\n    fill-opacity=\"0.3\"\n  />\n</svg>\n";

const __vite_glob_1_4 = "<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"none\" viewBox=\"0 0 190 190\">\n  <path\n    fill=\"currentColor\"\n    fill-rule=\"evenodd\"\n    d=\"M87 14c23-15 56-8 72 15v1a50 50 0 0 1 9 38c-1 6-4 12-7 17a50 50 0 0 1-3 51c-4 5-8 10-14 13l-41 26a54 54 0 0 1-81-33v-20c1-7 3-13 7-18a50 50 0 0 1 2-50c4-6 9-10 14-14l42-26ZM63 161c6 2 13 3 20 1l8-4 41-26a28 28 0 0 0 13-31l-5-11a33 33 0 0 0-35-13l-9 4-15 10a9 9 0 0 1-9 0 10 10 0 0 1-6-6v-4a9 9 0 0 1 4-6l41-26 3-1a10 10 0 0 1 10 4l2 6v1l1 1c6 2 12 4 16 8l3 1v-2l1-4a30 30 0 0 0-5-23 33 33 0 0 0-35-13l-8 4-42 26a28 28 0 0 0-13 19 30 30 0 0 0 6 23 33 33 0 0 0 35 13c3 0 5-2 8-3l16-10 2-2a10 10 0 0 1 12 8l1 3a9 9 0 0 1-4 6l-42 26-2 1a10 10 0 0 1-12-10v-1l-2-1c-6-1-11-4-16-8l-2-1-1 2-1 4a30 30 0 0 0 5 23c4 5 10 10 16 12Z\"\n    clip-rule=\"evenodd\"\n  />\n</svg>\n";

const __vite_glob_1_5 = "<svg viewBox=\"0 0 190 190\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n  <path\n    d=\"M149.4 17.0008H185.426L95.3608 172.999L5.2959 17.0008H41.3223L95.3611 110.598L149.4 17.0008Z\"\n    fill=\"currentColor\"\n  />\n  <path\n    d=\"M116.16 17.0007L95.3604 53.0268L74.5613 17.0007H41.3223L95.3611 110.598L149.4 17.0007H116.16Z\"\n    fill=\"currentColor\"\n    fill-opacity=\"0.45\"\n  />\n</svg>\n";

const __vite_glob_1_6 = "<svg viewBox=\"0 0 627 894\" fill=\"none\">\n  <path\n    fill-rule=\"evenodd\"\n    clip-rule=\"evenodd\"\n    d=\"M445.433 22.9832C452.722 32.0324 456.439 44.2432 463.873 68.6647L626.281 602.176C566.234 571.026 500.957 548.56 432.115 536.439L326.371 179.099C324.641 173.252 319.27 169.241 313.173 169.241C307.06 169.241 301.68 173.273 299.963 179.14L195.5 536.259C126.338 548.325 60.7632 570.832 0.459473 602.095L163.664 68.5412C171.121 44.1617 174.85 31.9718 182.14 22.9393C188.575 14.9651 196.946 8.77213 206.454 4.95048C217.224 0.621582 229.971 0.621582 255.466 0.621582H372.034C397.562 0.621582 410.326 0.621582 421.106 4.95951C430.622 8.78908 438.998 14.9946 445.433 22.9832Z\"\n    fill=\"currentColor\"\n  />\n  <path\n    fill-rule=\"evenodd\"\n    clip-rule=\"evenodd\"\n    d=\"M464.867 627.566C438.094 650.46 384.655 666.073 323.101 666.073C247.551 666.073 184.229 642.553 167.426 610.921C161.419 629.05 160.072 649.798 160.072 663.052C160.072 663.052 156.114 728.134 201.38 773.401C201.38 749.896 220.435 730.842 243.939 730.842C284.226 730.842 284.181 765.99 284.144 794.506C284.143 795.36 284.142 796.209 284.142 797.051C284.142 840.333 310.595 877.436 348.215 893.075C342.596 881.518 339.444 868.54 339.444 854.825C339.444 813.545 363.679 798.175 391.845 780.311C414.255 766.098 439.155 750.307 456.315 718.629C465.268 702.101 470.352 683.17 470.352 663.052C470.352 650.68 468.43 638.757 464.867 627.566Z\"\n    fill=\"#FF5D01\"\n  />\n</svg>\n";

const __vite_glob_1_7 = "<svg viewBox=\"0 0 190 190\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n  <path\n    d=\"M137.548 65.935L137.479 65.9052C137.439 65.8904 137.399 65.8755 137.365 65.8408C137.308 65.7797 137.266 65.7064 137.242 65.6265C137.218 65.5466 137.212 65.4623 137.226 65.38L141.056 41.9614L159.019 59.9292L140.338 67.8774C140.286 67.8984 140.23 67.9085 140.174 67.9071H140.1C140.075 67.8923 140.05 67.8725 140.001 67.8229C139.306 67.0488 138.474 66.4089 137.548 65.935V65.935ZM163.603 64.5078L182.809 83.7144C186.798 87.7083 188.795 89.7004 189.524 92.0095C189.633 92.3514 189.722 92.6933 189.791 93.0452L143.891 73.6057C143.866 73.5955 143.841 73.5856 143.816 73.576C143.633 73.5016 143.42 73.4174 143.42 73.2291C143.42 73.0408 143.638 72.9516 143.821 72.8773L143.881 72.8525L163.603 64.5078ZM189.008 99.2095C188.017 101.073 186.085 103.005 182.814 106.281L161.16 127.93L133.153 122.098L133.004 122.068C132.756 122.028 132.494 121.984 132.494 121.761C132.387 120.606 132.044 119.484 131.486 118.467C130.927 117.45 130.166 116.559 129.248 115.849C129.134 115.735 129.164 115.557 129.198 115.393C129.198 115.369 129.198 115.344 129.208 115.324L134.476 82.986L134.496 82.877C134.525 82.6292 134.57 82.3418 134.793 82.3418C135.922 82.2014 137.011 81.8377 137.998 81.272C138.985 80.7062 139.849 79.9497 140.541 79.0466C140.586 78.997 140.615 78.9425 140.675 78.9128C140.833 78.8384 141.022 78.9128 141.185 78.9821L189.003 99.2095H189.008ZM156.18 132.91L120.571 168.519L126.666 131.057L126.676 131.007C126.681 130.958 126.691 130.908 126.706 130.864C126.755 130.745 126.884 130.695 127.008 130.646L127.068 130.621C128.402 130.051 129.582 129.173 130.512 128.059C130.63 127.92 130.774 127.786 130.957 127.762C131.005 127.754 131.054 127.754 131.101 127.762L156.175 132.915L156.18 132.91ZM113.034 176.056L109.021 180.069L64.6463 115.938C64.6302 115.915 64.6137 115.892 64.5967 115.869C64.5273 115.775 64.453 115.681 64.4679 115.572C64.4679 115.492 64.5224 115.423 64.5769 115.364L64.6264 115.299C64.7602 115.101 64.8742 114.903 64.9981 114.69L65.0972 114.516L65.112 114.501C65.1814 114.382 65.2458 114.269 65.3648 114.204C65.4688 114.155 65.6125 114.174 65.7265 114.199L114.888 124.338C115.025 124.359 115.155 124.415 115.264 124.501C115.329 124.566 115.343 124.635 115.358 124.714C115.701 126.012 116.339 127.212 117.223 128.222C118.107 129.232 119.212 130.024 120.452 130.537C120.591 130.606 120.532 130.76 120.467 130.923C120.435 130.995 120.41 131.069 120.393 131.146C119.773 134.912 114.461 167.31 113.034 176.056ZM104.65 184.435C101.692 187.363 99.9475 188.914 97.9753 189.539C96.0307 190.154 93.9438 190.154 91.9993 189.539C89.6901 188.805 87.6931 186.813 83.7042 182.82L39.1416 138.257L50.7815 120.205C50.836 120.116 50.8905 120.036 50.9797 119.972C51.1035 119.883 51.2819 119.922 51.4306 119.972C54.1023 120.778 56.9708 120.633 59.5473 119.561C59.6811 119.511 59.8149 119.476 59.9189 119.571C59.971 119.618 60.0175 119.671 60.0577 119.729L104.65 184.44V184.435ZM34.8454 133.961L24.6227 123.738L44.8104 115.126C44.862 115.103 44.9176 115.091 44.9739 115.091C45.1424 115.091 45.2415 115.26 45.3307 115.413C45.5335 115.725 45.7484 116.029 45.9749 116.325L46.0393 116.404C46.0987 116.488 46.0591 116.573 45.9996 116.652L34.8503 133.961H34.8454ZM20.0985 119.214L7.1653 106.281C4.96517 104.081 3.36957 102.485 2.2596 101.112L41.5845 109.269C41.6339 109.278 41.6835 109.286 41.7332 109.293C41.976 109.333 42.2435 109.378 42.2435 109.606C42.2435 109.853 41.9512 109.967 41.7034 110.062L41.5895 110.111L20.0985 119.214ZM0 94.4624C0.0448161 93.6292 0.194659 92.8051 0.445973 92.0095C1.17935 89.7004 3.17136 87.7083 7.1653 83.7144L23.7159 67.1639C31.3362 78.2234 38.9772 89.2687 46.6389 100.3C46.7727 100.478 46.9213 100.676 46.7677 100.825C46.0442 101.623 45.3208 102.495 44.8104 103.441C44.755 103.563 44.6698 103.669 44.5626 103.749C44.4982 103.788 44.4288 103.773 44.3545 103.758H44.3446L0 94.4574V94.4624ZM28.1459 62.7339L50.39 40.4798C52.4861 41.3965 60.1023 44.6125 66.9059 47.4865C72.0593 49.6669 76.7569 51.649 78.2336 52.2931C78.3822 52.3526 78.516 52.4121 78.5804 52.5607C78.6201 52.6499 78.6002 52.7639 78.5804 52.858C78.2282 54.4644 78.2806 56.1331 78.7329 57.7142C79.1853 59.2953 80.0234 60.7393 81.172 61.9162C81.3207 62.0649 81.172 62.278 81.0432 62.4613L80.9738 62.5654L58.3779 97.5644C58.3184 97.6635 58.2639 97.7477 58.1648 97.8121C58.0459 97.8864 57.8774 97.8518 57.7386 97.8171C56.8598 97.5868 55.9563 97.4637 55.0479 97.4504C54.2353 97.4504 53.3532 97.599 52.4613 97.7626H52.4563C52.3572 97.7774 52.268 97.7972 52.1887 97.7378C52.1012 97.6662 52.0259 97.5809 51.9658 97.4851L28.1409 62.7339H28.1459ZM54.8943 35.9854L83.7042 7.17554C87.6931 3.18656 89.6901 1.1896 91.9993 0.461174C93.9438 -0.153725 96.0307 -0.153725 97.9753 0.461174C100.284 1.1896 102.281 3.18656 106.27 7.17554L112.514 13.4192L92.024 45.1526C91.9734 45.245 91.9042 45.326 91.8209 45.3905C91.697 45.4747 91.5236 45.44 91.3749 45.3905C89.7594 44.9002 88.0488 44.811 86.3911 45.1304C84.7334 45.4499 83.1784 46.1684 81.8608 47.2239C81.727 47.3627 81.5288 47.2834 81.3603 47.209C78.6845 46.0446 57.8724 37.249 54.8943 35.9854V35.9854ZM116.865 17.7699L135.784 36.689L131.225 64.9241V64.9984C131.221 65.0628 131.208 65.1262 131.185 65.1867C131.136 65.2858 131.037 65.3056 130.938 65.3354C129.963 65.6306 129.045 66.0879 128.222 66.6882C128.187 66.7134 128.154 66.7415 128.123 66.7724C128.069 66.8319 128.014 66.8864 127.925 66.8963C127.852 66.8985 127.78 66.8867 127.712 66.8616L98.8821 54.6122L98.8276 54.5874C98.6443 54.5131 98.4262 54.4239 98.4262 54.2356C98.2568 52.629 97.7321 51.0803 96.8901 49.7015C96.7514 49.4736 96.5977 49.2357 96.7167 49.0029L116.865 17.7699ZM97.3807 60.4148L124.407 71.8614C124.555 71.9308 124.719 71.9952 124.783 72.1488C124.809 72.2412 124.809 72.3389 124.783 72.4313C124.704 72.8277 124.635 73.2786 124.635 73.7345V74.4927C124.635 74.681 124.441 74.7603 124.263 74.8346L124.208 74.8544C119.927 76.6829 64.1012 100.488 64.0169 100.488C63.9327 100.488 63.8435 100.488 63.7593 100.404C63.6106 100.255 63.7593 100.047 63.8931 99.8586C63.9167 99.826 63.9398 99.7929 63.9624 99.7595L86.1719 65.3701L86.2115 65.3106C86.3404 65.1025 86.489 64.8696 86.7269 64.8696L86.9499 64.9043C87.4553 64.9736 87.9013 65.0381 88.3522 65.0381C91.7218 65.0381 94.8436 63.3979 96.7266 60.5932C96.7714 60.5183 96.8284 60.4513 96.8951 60.395C97.0289 60.2959 97.2271 60.3454 97.3807 60.4148V60.4148ZM66.4301 105.929L127.281 79.9782C127.281 79.9782 127.37 79.9782 127.454 80.0624C127.786 80.3944 128.069 80.6174 128.341 80.8255L128.475 80.9097C128.599 80.9791 128.723 81.0584 128.733 81.1872C128.733 81.2368 128.733 81.2665 128.723 81.3111L123.51 113.332L123.49 113.461C123.455 113.709 123.421 113.991 123.188 113.991C121.798 114.085 120.452 114.516 119.266 115.247C118.081 115.979 117.091 116.988 116.384 118.188L116.359 118.228C116.29 118.342 116.226 118.451 116.112 118.51C116.007 118.56 115.874 118.54 115.765 118.515L67.2379 108.506C67.1883 108.496 66.4847 105.934 66.4301 105.929V105.929Z\"\n    fill=\"currentColor\"\n  />\n</svg>\n";

const __vite_glob_1_8 = "<svg viewBox=\"0 0 190 190\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n  <path\n    d=\"M113.3 0H111.3V2V20.5996V22.5996H113.3H131.9H133.9V20.5996V2V0H131.9H113.3Z\"\n    fill=\"currentColor\"\n  />\n  <path\n    d=\"M53.5 0C46.3 0 39.3002 1.4002 32.7002 4.2002C26.3002 6.9002 20.6002 10.8002 15.7002 15.7002C10.8002 20.6002 6.9002 26.3002 4.2002 32.7002C1.4002 39.3002 0 46.3 0 53.5V131.9V133.9H2H20.5996H22.5996V131.9V53.2002C22.9996 45.1002 26.3996 37.5004 32.0996 31.9004C37.8996 26.2004 45.4996 22.8996 53.5996 22.5996H94.7998H96.7998V20.5996V2V0H94.7998H53.5Z\"\n    fill=\"currentColor\"\n  />\n  <path\n    d=\"M150.4 74.2002H148.4V76.2002V94.7998V96.7998H150.4H169H171V94.7998V76.2002V74.2002H169H150.4Z\"\n    fill=\"currentColor\"\n  />\n  <path\n    d=\"M150.4 37.0996H148.4V39.0996V57.7002V59.7002H150.4H169H171V57.7002V39.0996V37.0996H169H150.4Z\"\n    fill=\"currentColor\"\n  />\n  <path\n    d=\"M169 0H150.4H148.4V2V20.5996V22.5996H150.4H169H171V20.5996V2V0H169Z\"\n    fill=\"currentColor\"\n  />\n  <path\n    d=\"M150.4 111.3H148.4V113.3V131.9V133.9H150.4H169H171V131.9V113.3V111.3H169H150.4Z\"\n    fill=\"currentColor\"\n  />\n  <path\n    d=\"M150.4 148.4H148.4V150.4V169V171H150.4H169H171V169V150.4V148.4H169H150.4Z\"\n    fill=\"currentColor\"\n  />\n  <path\n    d=\"M113.3 148.4H111.3V150.4V169V171H113.3H131.9H133.9V169V150.4V148.4H131.9H113.3Z\"\n    fill=\"currentColor\"\n  />\n  <path\n    d=\"M76.2002 148.4H74.2002V150.4V169V171H76.2002H94.7998H96.7998V169V150.4V148.4H94.7998H76.2002Z\"\n    fill=\"currentColor\"\n  />\n  <path\n    d=\"M39.0996 148.4H37.0996V150.4V169V171H39.0996H57.7002H59.7002V169V150.4V148.4H57.7002H39.0996Z\"\n    fill=\"currentColor\"\n  />\n  <path\n    d=\"M2 148.4H0V150.4V169V171H2H20.5996H22.5996V169V150.4V148.4H20.5996H2Z\"\n    fill=\"currentColor\"\n  />\n</svg>\n";

const __vite_glob_1_9 = "<svg viewBox=\"0 0 190 190\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n  <path d=\"M94.9998 13L190 177.546H0L94.9998 13Z\" fill=\"currentColor\" />\n</svg>\n";

const __vite_glob_1_10 = "<!-- source: https://github.com/basmilius/weather-icons -->\n<svg\n  xmlns=\"http://www.w3.org/2000/svg\"\n  xmlns:xlink=\"http://www.w3.org/1999/xlink\"\n  viewBox=\"0 0 512 512\"\n>\n  <defs>\n    <linearGradient\n      id=\"a\"\n      x1=\"54.33\"\n      y1=\"29.03\"\n      x2=\"187.18\"\n      y2=\"259.13\"\n      gradientUnits=\"userSpaceOnUse\"\n    >\n      <stop offset=\"0\" stop-color=\"currentColor\" />\n      <stop offset=\"0.45\" stop-color=\"currentColor\" />\n      <stop offset=\"1\" stop-color=\"currentColor\" />\n    </linearGradient>\n    <linearGradient\n      id=\"b\"\n      x1=\"294\"\n      y1=\"112.82\"\n      x2=\"330\"\n      y2=\"175.18\"\n      gradientUnits=\"userSpaceOnUse\"\n    >\n      <stop offset=\"0\" stop-color=\"currentColor\" />\n      <stop offset=\"0.45\" stop-color=\"currentColor\" />\n      <stop offset=\"1\" stop-color=\"currentColor\" />\n    </linearGradient>\n    <linearGradient\n      id=\"c\"\n      x1=\"295.52\"\n      y1=\"185.86\"\n      x2=\"316.48\"\n      y2=\"222.14\"\n      xlink:href=\"#b\"\n    />\n    <linearGradient\n      id=\"d\"\n      x1=\"356.29\"\n      y1=\"194.78\"\n      x2=\"387.71\"\n      y2=\"249.22\"\n      xlink:href=\"#b\"\n    />\n    <symbol id=\"e\" viewBox=\"0 0 270 270\" overflow=\"visible\">\n      <!-- moon -->\n      <path\n        d=\"M252.25,168.63C178.13,168.63,118,109.35,118,36.21A130.48,130.48,0,0,1,122.47,3C55.29,10.25,3,66.37,3,134.58,3,207.71,63.09,267,137.21,267,199.69,267,252,224.82,267,167.79A135.56,135.56,0,0,1,252.25,168.63Z\"\n        stroke=\"currentColor\"\n        stroke-linecap=\"round\"\n        stroke-linejoin=\"round\"\n        stroke-width=\"6\"\n        fill=\"url(#a)\"\n      >\n        <animateTransform\n          attributeName=\"transform\"\n          additive=\"sum\"\n          type=\"rotate\"\n          values=\"-15 135 135; 9 135 135; -15 135 135\"\n          dur=\"6s\"\n          repeatCount=\"indefinite\"\n        />\n      </path>\n    </symbol>\n  </defs>\n\n  <!-- star-1 -->\n  <path\n    d=\"M282.83,162.84l24.93-6.42a1.78,1.78,0,0,1,1.71.46l18.37,18a1.8,1.8,0,0,0,3-1.73l-6.42-24.93a1.78,1.78,0,0,1,.46-1.71l18-18.37a1.8,1.8,0,0,0-1.73-3l-24.93,6.42a1.78,1.78,0,0,1-1.71-.46l-18.37-18a1.8,1.8,0,0,0-3,1.73l6.42,24.93a1.78,1.78,0,0,1-.46,1.71l-18,18.37A1.8,1.8,0,0,0,282.83,162.84Z\"\n    stroke=\"currentColor\"\n    stroke-linecap=\"round\"\n    stroke-linejoin=\"round\"\n    stroke-width=\"2\"\n    fill=\"url(#b)\"\n  >\n    <animateTransform\n      attributeName=\"transform\"\n      additive=\"sum\"\n      type=\"rotate\"\n      values=\"-15 312 144; 15 312 144; -15 312 144\"\n      dur=\"6s\"\n      calcMode=\"spline\"\n      keySplines=\".42, 0, .58, 1; .42, 0, .58, 1\"\n      repeatCount=\"indefinite\"\n    />\n\n    <animate\n      attributeName=\"opacity\"\n      values=\"1; .75; 1; .75; 1; .75; 1\"\n      dur=\"6s\"\n    />\n  </path>\n\n  <!-- star-2 -->\n  <path\n    d=\"M285.4,193.44l12,12.25a1.19,1.19,0,0,1,.3,1.14l-4.28,16.62a1.2,1.2,0,0,0,2,1.15l12.25-12a1.19,1.19,0,0,1,1.14-.3l16.62,4.28a1.2,1.2,0,0,0,1.15-2l-12-12.25a1.19,1.19,0,0,1-.3-1.14l4.28-16.62a1.2,1.2,0,0,0-2-1.15l-12.25,12a1.19,1.19,0,0,1-1.14.3l-16.62-4.28A1.2,1.2,0,0,0,285.4,193.44Z\"\n    stroke=\"currentColor\"\n    stroke-linecap=\"round\"\n    stroke-linejoin=\"round\"\n    stroke-width=\"2\"\n    fill=\"url(#c)\"\n  >\n    <animateTransform\n      attributeName=\"transform\"\n      additive=\"sum\"\n      type=\"rotate\"\n      values=\"-15 306 204; 15 306 204; -15 306 204\"\n      begin=\"-.33s\"\n      dur=\"6s\"\n      calcMode=\"spline\"\n      keySplines=\".42, 0, .58, 1; .42, 0, .58, 1\"\n      repeatCount=\"indefinite\"\n    />\n\n    <animate\n      attributeName=\"opacity\"\n      values=\"1; .75; 1; .75; 1; .75; 1\"\n      begin=\"-.33s\"\n      dur=\"6s\"\n    />\n  </path>\n\n  <!-- star-3 -->\n  <path\n    d=\"M337.32,223.73l24.8,6.9a1.83,1.83,0,0,1,1.25,1.25l6.9,24.8a1.79,1.79,0,0,0,3.46,0l6.9-24.8a1.83,1.83,0,0,1,1.25-1.25l24.8-6.9a1.79,1.79,0,0,0,0-3.46l-24.8-6.9a1.83,1.83,0,0,1-1.25-1.25l-6.9-24.8a1.79,1.79,0,0,0-3.46,0l-6.9,24.8a1.83,1.83,0,0,1-1.25,1.25l-24.8,6.9A1.79,1.79,0,0,0,337.32,223.73Z\"\n    stroke=\"currentColor\"\n    stroke-linecap=\"round\"\n    stroke-linejoin=\"round\"\n    stroke-width=\"2\"\n    fill=\"url(#d)\"\n  >\n    <animateTransform\n      attributeName=\"transform\"\n      additive=\"sum\"\n      type=\"rotate\"\n      values=\"-15 372 222; 15 372 222; -15 372 222\"\n      begin=\"-.67s\"\n      dur=\"6s\"\n      calcMode=\"spline\"\n      keySplines=\".42, 0, .58, 1; .42, 0, .58, 1\"\n      repeatCount=\"indefinite\"\n    />\n\n    <animate\n      attributeName=\"opacity\"\n      values=\"1; .75; 1; .75; 1; .75; 1\"\n      begin=\"-.67s\"\n      dur=\"6s\"\n    />\n  </path>\n\n  <use\n    width=\"270\"\n    height=\"270\"\n    transform=\"translate(121 121)\"\n    xlink:href=\"#e\"\n  />\n</svg>\n";

const __vite_glob_1_11 = "<!-- source: https://github.com/basmilius/weather-icons -->\n<svg\n  xmlns=\"http://www.w3.org/2000/svg\"\n  xmlns:xlink=\"http://www.w3.org/1999/xlink\"\n  viewBox=\"0 0 512 512\"\n>\n  <defs>\n    <linearGradient\n      id=\"a\"\n      x1=\"149.99\"\n      y1=\"119.24\"\n      x2=\"234.01\"\n      y2=\"264.76\"\n      gradientUnits=\"userSpaceOnUse\"\n    >\n      <stop offset=\"0\" stop-color=\"currentColor\" />\n      <stop offset=\"0.45\" stop-color=\"currentColor\" />\n      <stop offset=\"1\" stop-color=\"currentColor\" />\n    </linearGradient>\n    <symbol id=\"b\" viewBox=\"0 0 384 384\">\n      <!-- core -->\n      <circle\n        cx=\"192\"\n        cy=\"192\"\n        r=\"84\"\n        stroke=\"currentColor\"\n        stroke-miterlimit=\"10\"\n        stroke-width=\"6\"\n        fill=\"url(#a)\"\n      />\n\n      <!-- rays -->\n      <path\n        d=\"M192,61.66V12m0,360V322.34M284.17,99.83l35.11-35.11M64.72,319.28l35.11-35.11m0-184.34L64.72,64.72M319.28,319.28l-35.11-35.11M61.66,192H12m360,0H322.34\"\n        fill=\"none\"\n        stroke=\"currentColor\"\n        stroke-linecap=\"round\"\n        stroke-miterlimit=\"10\"\n        stroke-width=\"24\"\n      >\n        <animateTransform\n          attributeName=\"transform\"\n          additive=\"sum\"\n          type=\"rotate\"\n          values=\"0 192 192; 45 192 192\"\n          dur=\"6s\"\n          repeatCount=\"indefinite\"\n        />\n      </path>\n    </symbol>\n  </defs>\n  <use width=\"384\" height=\"384\" transform=\"translate(64 64)\" xlink:href=\"#b\" />\n</svg>\n";

const __vite_glob_1_12 = "<?xml version=\"1.0\" standalone=\"no\"?>\n<!DOCTYPE svg PUBLIC \"-//W3C//DTD SVG 20010904//EN\"\n \"http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd\">\n<svg version=\"1.0\" xmlns=\"http://www.w3.org/2000/svg\"\n width=\"720.000000pt\" height=\"140.000000pt\" viewBox=\"0 0 720.000000 140.000000\"\n preserveAspectRatio=\"xMidYMid meet\">\n\n<g transform=\"translate(0.000000,140.000000) scale(0.100000,-0.100000)\"\nfill=\"#000000\" stroke=\"none\">\n<path d=\"M477 1236 c-20 -7 -52 -25 -71 -40 -70 -53 -73 -66 -122 -432 -24\n-185 -44 -359 -44 -386 0 -95 49 -158 140 -177 62 -13 202 -14 289 -1 82 12\n217 77 259 124 33 38 36 38 46 -10 7 -32 53 -82 96 -104 67 -35 186 -2 246 68\nl31 35 42 -46 c63 -68 143 -86 236 -53 38 14 42 13 65 -7 l25 -22 -23 26 -22\n25 23 22 23 22 25 -26 c61 -65 148 -75 244 -26 l60 30 18 -22 c16 -20 16 -20\n0 10 -15 28 -15 32 2 57 21 32 35 35 35 7 0 -11 18 -38 39 -59 44 -44 109 -64\n167 -51 40 9 144 69 144 83 0 5 20 -9 44 -31 41 -38 123 -88 131 -80 2 2 -20\n16 -49 31 -29 15 -67 43 -85 61 -33 34 -33 37 -6 93 1 2 28 -24 61 -56 78 -76\n148 -103 254 -101 108 2 129 2 190 0 85 -4 162 44 203 125 8 17 23 83 32 148\n19 138 12 178 -40 235 l-33 37 40 34 c84 71 99 174 43 286 -52 102 -147 164\n-275 180 -139 17 -328 -74 -402 -193 l-21 -34 -29 51 c-110 190 -358 232 -565\n94 -31 -20 -75 -61 -97 -90 -23 -29 -43 -47 -45 -40 -2 6 -7 14 -11 17 -3 3\n-16 22 -29 42 -32 53 -95 104 -160 130 -50 20 -74 23 -221 23 -142 0 -170 -3\n-200 -19 -49 -26 -89 -65 -112 -110 -17 -34 -22 -37 -30 -22 -21 37 -86 89\n-148 119 -63 29 -71 31 -220 34 -115 2 -165 0 -193 -11z m371 -41 c103 -31\n181 -118 204 -227 10 -49 8 -81 -14 -240 -22 -157 -31 -194 -58 -247 -41 -82\n-105 -145 -188 -184 l-67 -32 -178 0 -179 0 -29 32 c-16 18 -31 44 -35 57 -9\n37 82 719 101 755 19 39 52 70 90 87 44 19 286 19 353 -1z m779 -24 c67 -36\n102 -75 135 -147 16 -38 19 -62 16 -133 -4 -105 -37 -181 -108 -252 l-46 -46\n48 -57 c44 -53 48 -62 48 -110 0 -95 -74 -166 -174 -166 -40 0 -52 5 -89 39\n-23 22 -58 60 -77 85 -19 25 -38 45 -41 46 -4 0 -9 -16 -12 -35 -13 -77 -87\n-135 -173 -135 -41 0 -51 5 -85 39 -31 31 -39 46 -39 76 0 53 78 662 90 706\n14 50 46 88 94 111 36 16 60 18 196 16 154 -3 155 -4 217 -37z m725 4 c91 -46\n127 -91 154 -194 15 -60 15 -71 -15 -309 -36 -282 -42 -310 -77 -352 -53 -62\n-138 -79 -202 -40 -58 35 -69 87 -46 212 5 27 4 28 -39 28 -50 0 -48 3 -63\n-103 -13 -93 -85 -157 -179 -157 -40 0 -52 5 -80 33 -19 19 -37 46 -41 61 -4\n16 9 145 29 297 40 303 52 343 131 427 49 52 137 105 202 122 65 16 167 5 226\n-25z m722 4 c61 -28 112 -80 142 -144 29 -62 30 -96 3 -153 -29 -60 -86 -96\n-150 -96 -59 0 -95 23 -125 80 -23 44 -52 54 -76 27 -25 -27 -60 -297 -42\n-321 12 -15 13 -14 14 9 0 34 37 88 79 116 28 19 47 23 113 23 141 0 175 -38\n165 -181 -10 -140 -24 -186 -67 -229 -42 -42 -86 -56 -147 -46 -46 7 -39 7\n-143 0 -72 -5 -94 -3 -140 15 -102 39 -175 136 -186 248 -3 37 3 119 19 229\n30 201 53 259 139 340 61 58 81 70 158 96 72 24 178 19 244 -13z m-144 -419\nc0 -7 -52 -31 -57 -26 -2 2 -1 22 3 46 l7 42 23 -29 c13 -15 23 -30 24 -33z\nm-1214 -207 c-3 -3 -12 0 -21 7 -14 12 -14 15 2 33 18 19 18 19 21 -8 2 -15 1\n-29 -2 -32z\"/>\n<path d=\"M670 908 c-1 -2 -11 -81 -24 -175 l-23 -173 38 0 c50 0 54 10 73 155\n20 151 20 181 0 189 -15 6 -64 9 -64 4z\"/>\n<path d=\"M1396 898 c-3 -7 -6 -28 -9 -45 -3 -32 -3 -33 35 -33 32 0 41 5 50\n26 8 18 9 30 1 42 -13 21 -71 29 -77 10z\"/>\n<path d=\"M2142 893 c-15 -13 -22 -36 -27 -80 l-7 -61 43 2 c48 3 56 15 58 92\n2 61 -27 81 -67 47z\"/>\n<path d=\"M3670 1241 c-74 -23 -139 -81 -159 -143 -6 -18 -31 -191 -56 -383\n-35 -279 -43 -358 -34 -388 38 -138 208 -174 322 -68 53 49 67 92 93 290 13\n102 28 205 34 229 5 23 10 58 10 77 0 19 2 35 5 35 3 0 22 -9 42 -20 21 -11\n46 -20 55 -20 23 0 23 6 -11 -258 -27 -203 -28 -228 -15 -271 23 -78 83 -122\n168 -123 84 -1 178 63 207 140 6 15 23 128 39 253 16 124 32 233 36 242 3 10\n16 17 28 17 32 1 98 34 128 66 15 16 37 51 49 78 37 85 9 180 -69 228 -35 22\n-47 23 -265 26 -251 4 -308 -5 -366 -54 l-31 -26 -35 30 c-50 45 -116 61 -175\n43z m130 -49 c19 -11 43 -35 53 -55 l19 -37 -46 -356 c-29 -221 -52 -369 -62\n-391 -26 -54 -76 -86 -143 -91 -53 -4 -61 -2 -94 28 -23 19 -39 44 -43 65 -6\n32 68 654 87 726 13 50 45 88 93 110 52 24 92 24 136 1z m727 -2 c41 -25 63\n-59 65 -101 3 -98 -74 -179 -171 -179 -49 0 -41 28 -81 -285 -18 -133 -38\n-255 -47 -273 -26 -54 -76 -85 -144 -90 -56 -4 -60 -3 -93 30 -19 19 -38 47\n-42 61 -3 15 8 138 25 275 17 136 31 255 31 265 0 13 -9 17 -37 17 -50 0 -82\n18 -110 59 -26 39 -30 98 -9 139 18 35 64 78 96 91 14 5 128 10 255 10 211 1\n233 -1 262 -19z\"/>\n<path d=\"M5154 1236 c-135 -31 -258 -128 -314 -249 -41 -87 -86 -413 -69 -503\n15 -81 49 -144 109 -197 68 -61 143 -89 240 -89 98 0 155 21 261 92 48 32 90\n56 93 52 4 -3 4 1 1 10 -6 16 22 67 36 68 4 0 10 -11 13 -24 3 -13 24 -47 46\n-74 70 -89 207 -139 335 -121 158 21 322 163 364 314 15 53 52 282 52 320 -1\n51 10 57 54 35 22 -11 48 -20 58 -20 16 0 18 -5 13 -32 -20 -117 -57 -439 -53\n-470 12 -89 87 -151 184 -151 85 0 169 62 201 148 6 17 23 124 37 240 23 178\n30 214 48 235 14 15 15 19 5 11 -16 -12 -18 -11 -18 4 0 13 6 16 27 12 36 -7\n125 51 160 104 31 47 41 128 24 182 -15 45 -68 93 -118 106 -48 14 -446 14\n-493 1 -20 -5 -56 -23 -81 -38 l-45 -29 -33 27 c-18 16 -52 33 -77 40 -80 23\n-188 -21 -234 -95 l-22 -36 -15 28 c-39 76 -120 121 -195 109 -78 -13 -169\n-83 -184 -141 -5 -22 -9 -20 -64 35 -91 91 -215 125 -346 96z m231 -55 c108\n-48 175 -151 175 -270 0 -81 -36 -337 -54 -389 -34 -94 -119 -186 -215 -231\n-49 -23 -69 -26 -156 -26 -83 0 -107 4 -140 21 -93 50 -152 136 -162 237 -6\n64 32 364 54 421 46 117 134 202 253 244 81 28 171 26 245 -7z m466 14 c37\n-20 69 -70 69 -110 0 -17 -14 -133 -30 -259 -17 -126 -28 -237 -25 -247 7 -22\n57 -26 73 -6 5 6 25 128 45 269 37 274 40 287 102 334 95 72 225 18 225 -95 0\n-87 -61 -512 -80 -564 -91 -241 -394 -337 -578 -182 -17 14 -45 53 -61 87 -26\n51 -31 73 -31 131 0 64 53 497 66 540 9 29 66 89 99 103 41 18 90 17 126 -1z\nm1114 1 c89 -38 99 -163 19 -238 -36 -33 -74 -48 -125 -48 -25 0 -39 -5 -39\n-13 0 -15 -57 -457 -65 -505 -7 -37 -55 -96 -96 -118 -15 -7 -46 -14 -69 -14\n-84 0 -134 53 -131 139 0 26 14 147 31 271 16 124 30 228 30 233 0 4 -19 7\n-41 7 -57 0 -103 31 -123 82 -20 49 -14 87 21 141 44 69 75 77 331 77 172 0\n231 -3 257 -14z\"/>\n<path d=\"M5186 894 c-9 -8 -16 -18 -16 -22 0 -4 -9 -68 -19 -142 -12 -87 -15\n-141 -9 -152 13 -26 55 -23 71 5 21 33 51 296 36 313 -15 19 -44 18 -63 -2z\"/>\n<path d=\"M3446 1065 c-3 -9 -6 -24 -5 -33 0 -9 5 -4 10 12 9 32 6 48 -5 21z\"/>\n<path d=\"M261 1024 c0 -11 3 -14 6 -6 3 7 2 16 -1 19 -3 4 -6 -2 -5 -13z\"/>\n<path d=\"M4790 980 c-6 -11 -8 -20 -6 -20 3 0 10 9 16 20 6 11 8 20 6 20 -3 0\n-10 -9 -16 -20z\"/>\n<path d=\"M3432 970 c0 -14 2 -19 5 -12 2 6 2 18 0 25 -3 6 -5 1 -5 -13z\"/>\n<path d=\"M251 944 c0 -11 3 -14 6 -6 3 7 2 16 -1 19 -3 4 -6 -2 -5 -13z\"/>\n<path d=\"M4766 935 c-9 -26 -7 -32 5 -12 6 10 9 21 6 23 -2 3 -7 -2 -11 -11z\"/>\n<path d=\"M3422 895 c0 -16 2 -22 5 -12 2 9 2 23 0 30 -3 6 -5 -1 -5 -18z\"/>\n<path d=\"M4751 884 c0 -11 3 -14 6 -6 3 7 2 16 -1 19 -3 4 -6 -2 -5 -13z\"/>\n<path d=\"M242 865 c0 -16 2 -22 5 -12 2 9 2 23 0 30 -3 6 -5 -1 -5 -18z\"/>\n<path d=\"M4742 840 c0 -14 2 -19 5 -12 2 6 2 18 0 25 -3 6 -5 1 -5 -13z\"/>\n<path d=\"M3412 820 c0 -19 2 -27 5 -17 2 9 2 25 0 35 -3 9 -5 1 -5 -18z\"/>\n<path d=\"M232 790 c0 -19 2 -27 5 -17 2 9 2 25 0 35 -3 9 -5 1 -5 -18z\"/>\n<path d=\"M3920 806 c0 -2 7 -6 15 -10 8 -3 15 -1 15 4 0 6 -7 10 -15 10 -8 0\n-15 -2 -15 -4z\"/>\n<path d=\"M6378 803 c7 -3 16 -2 19 1 4 3 -2 6 -13 5 -11 0 -14 -3 -6 -6z\"/>\n<path d=\"M6338 793 c7 -3 16 -2 19 1 4 3 -2 6 -13 5 -11 0 -14 -3 -6 -6z\"/>\n<path d=\"M4732 770 c0 -14 2 -19 5 -12 2 6 2 18 0 25 -3 6 -5 1 -5 -13z\"/>\n<path d=\"M6382 755 c0 -16 2 -22 5 -12 2 9 2 23 0 30 -3 6 -5 -1 -5 -18z\"/>\n<path d=\"M3402 745 c0 -16 2 -22 5 -12 2 9 2 23 0 30 -3 6 -5 -1 -5 -18z\"/>\n<path d=\"M3932 730 c0 -19 2 -27 5 -17 2 9 2 25 0 35 -3 9 -5 1 -5 -18z\"/>\n<path d=\"M222 710 c0 -19 2 -27 5 -17 2 9 2 25 0 35 -3 9 -5 1 -5 -18z\"/>\n<path d=\"M6372 680 c0 -19 2 -27 5 -17 2 9 2 25 0 35 -3 9 -5 1 -5 -18z\"/>\n<path d=\"M3392 665 c0 -16 2 -22 5 -12 2 9 2 23 0 30 -3 6 -5 -1 -5 -18z\"/>\n<path d=\"M3922 645 c0 -16 2 -22 5 -12 2 9 2 23 0 30 -3 6 -5 -1 -5 -18z\"/>\n<path d=\"M212 635 c0 -16 2 -22 5 -12 2 9 2 23 0 30 -3 6 -5 -1 -5 -18z\"/>\n<path d=\"M6362 600 c0 -19 2 -27 5 -17 2 9 2 25 0 35 -3 9 -5 1 -5 -18z\"/>\n<path d=\"M4711 604 c0 -11 3 -14 6 -6 3 7 2 16 -1 19 -3 4 -6 -2 -5 -13z\"/>\n<path d=\"M3381 584 c0 -11 3 -14 6 -6 3 7 2 16 -1 19 -3 4 -6 -2 -5 -13z\"/>\n<path d=\"M202 560 c0 -19 2 -27 5 -17 2 9 2 25 0 35 -3 9 -5 1 -5 -18z\"/>\n<path d=\"M3912 570 c0 -14 2 -19 5 -12 2 6 2 18 0 25 -3 6 -5 1 -5 -13z\"/>\n<path d=\"M6352 530 c0 -19 2 -27 5 -17 2 9 2 25 0 35 -3 9 -5 1 -5 -18z\"/>\n<path d=\"M3372 510 c0 -14 2 -19 5 -12 2 6 2 18 0 25 -3 6 -5 1 -5 -13z\"/>\n<path d=\"M3902 495 c0 -16 2 -22 5 -12 2 9 2 23 0 30 -3 6 -5 -1 -5 -18z\"/>\n<path d=\"M4701 504 c0 -11 3 -14 6 -6 3 7 2 16 -1 19 -3 4 -6 -2 -5 -13z\"/>\n<path d=\"M192 480 c0 -19 2 -27 5 -17 2 9 2 25 0 35 -3 9 -5 1 -5 -18z\"/>\n<path d=\"M6342 450 c0 -19 2 -27 5 -17 2 9 2 25 0 35 -3 9 -5 1 -5 -18z\"/>\n<path d=\"M3892 420 c0 -19 2 -27 5 -17 2 9 2 25 0 35 -3 9 -5 1 -5 -18z\"/>\n<path d=\"M4711 434 c0 -11 3 -14 6 -6 3 7 2 16 -1 19 -3 4 -6 -2 -5 -13z\"/>\n<path d=\"M182 410 c0 -19 2 -27 5 -17 2 9 2 25 0 35 -3 9 -5 1 -5 -18z\"/>\n<path d=\"M3362 420 c0 -14 2 -19 5 -12 2 6 2 18 0 25 -3 6 -5 1 -5 -13z\"/>\n<path d=\"M6333 350 c0 -30 2 -43 4 -27 2 15 2 39 0 55 -2 15 -4 2 -4 -28z\"/>\n<path d=\"M4730 374 c0 -17 55 -97 86 -125 16 -15 43 -34 59 -43 30 -17 30 -17\n5 1 -59 43 -93 80 -121 127 -16 28 -29 46 -29 40z\"/>\n<path d=\"M3352 345 c0 -16 2 -22 5 -12 2 9 2 23 0 30 -3 6 -5 -1 -5 -18z\"/>\n<path d=\"M3882 340 c0 -14 2 -19 5 -12 2 6 2 18 0 25 -3 6 -5 1 -5 -13z\"/>\n<path d=\"M5488 315 c6 -11 30 -38 53 -60 43 -39 43 -39 -6 15 -27 30 -51 57\n-53 60 -3 3 0 -4 6 -15z\"/>\n<path d=\"M181 300 c0 -8 4 -22 9 -30 12 -18 12 -2 0 25 -6 13 -9 15 -9 5z\"/>\n<path d=\"M3891 294 c0 -11 3 -14 6 -6 3 7 2 16 -1 19 -3 4 -6 -2 -5 -13z\"/>\n<path d=\"M3361 289 c-1 -8 6 -24 15 -35 15 -19 15 -19 6 1 -5 11 -12 27 -15\n35 -5 13 -6 13 -6 -1z\"/>\n<path d=\"M910 287 c-1 -25 51 -92 85 -109 11 -5 5 2 -13 17 -18 15 -41 43 -52\n63 -10 21 -19 33 -20 29z\"/>\n<path d=\"M6358 245 c6 -11 23 -31 39 -45 l28 -25 -30 35 c-47 55 -48 56 -37\n35z\"/>\n<path d=\"M1335 228 c16 -26 72 -68 91 -68 5 0 -7 10 -26 21 -19 12 -45 33 -58\n48 l-23 26 16 -27z\"/>\n<path d=\"M3919 232 c5 -10 18 -25 27 -33 11 -9 9 -2 -6 19 -26 35 -36 42 -21\n14z\"/>\n<path d=\"M3405 210 c10 -11 20 -20 23 -20 3 0 -3 9 -13 20 -10 11 -20 20 -23\n20 -3 0 3 -9 13 -20z\"/>\n<path d=\"M269 181 c13 -12 28 -21 34 -21 12 0 11 0 -28 24 l-30 17 24 -20z\"/>\n<path d=\"M2119 181 c13 -12 28 -21 34 -21 12 0 11 0 -28 24 l-30 17 24 -20z\"/>\n<path d=\"M1720 185 c0 -8 61 -36 70 -33 5 2 -9 11 -30 20 -22 9 -40 15 -40 13z\"/>\n<path d=\"M3440 185 c0 -8 61 -36 70 -33 5 2 -9 11 -30 20 -22 9 -40 15 -40 13z\"/>\n<path d=\"M3984 176 c11 -9 24 -16 30 -16 12 0 7 5 -24 19 -24 11 -24 11 -6 -3z\"/>\n<path d=\"M4920 180 c8 -5 20 -10 25 -10 6 0 3 5 -5 10 -8 5 -19 10 -25 10 -5\n0 -3 -5 5 -10z\"/>\n<path d=\"M2868 163 c7 -3 16 -2 19 1 4 3 -2 6 -13 5 -11 0 -14 -3 -6 -6z\"/>\n<path d=\"M618 153 c7 -3 16 -2 19 1 4 3 -2 6 -13 5 -11 0 -14 -3 -6 -6z\"/>\n<path d=\"M1448 153 c7 -3 16 -2 19 1 4 3 -2 6 -13 5 -11 0 -14 -3 -6 -6z\"/>\n<path d=\"M2178 153 c7 -3 16 -2 19 1 4 3 -2 6 -13 5 -11 0 -14 -3 -6 -6z\"/>\n<path d=\"M2683 153 c9 -2 23 -2 30 0 6 3 -1 5 -18 5 -16 0 -22 -2 -12 -5z\"/>\n<path d=\"M2808 153 c7 -3 16 -2 19 1 4 3 -2 6 -13 5 -11 0 -14 -3 -6 -6z\"/>\n<path d=\"M2908 153 c7 -3 16 -2 19 1 4 3 -2 6 -13 5 -11 0 -14 -3 -6 -6z\"/>\n<path d=\"M4998 153 c6 -2 18 -2 25 0 6 3 1 5 -13 5 -14 0 -19 -2 -12 -5z\"/>\n<path d=\"M5128 153 c7 -3 16 -2 19 1 4 3 -2 6 -13 5 -11 0 -14 -3 -6 -6z\"/>\n<path d=\"M5728 153 c6 -2 18 -2 25 0 6 3 1 5 -13 5 -14 0 -19 -2 -12 -5z\"/>\n<path d=\"M5848 153 c7 -3 16 -2 19 1 4 3 -2 6 -13 5 -11 0 -14 -3 -6 -6z\"/>\n<path d=\"M6478 153 c7 -3 16 -2 19 1 4 3 -2 6 -13 5 -11 0 -14 -3 -6 -6z\"/>\n</g>\n</svg>\n";

const SPRITESHEET_NAMESPACE = `astroicon`;

const $$module1$4 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  SPRITESHEET_NAMESPACE
}, Symbol.toStringTag, { value: 'Module' }));

const baseURL = "https://api.astroicon.dev/v1/";
const requests = /* @__PURE__ */ new Map();
const fetchCache = /* @__PURE__ */ new Map();
async function get(pack, name) {
  const url = new URL(`./${pack}/${name}`, baseURL).toString();
  if (requests.has(url)) {
    return await requests.get(url);
  }
  if (fetchCache.has(url)) {
    return fetchCache.get(url);
  }
  let request = async () => {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(await res.text());
    }
    const contentType = res.headers.get("Content-Type");
    if (!contentType.includes("svg")) {
      throw new Error(`[astro-icon] Unable to load "${name}" because it did not resolve to an SVG!

Recieved the following "Content-Type":
${contentType}`);
    }
    const svg = await res.text();
    fetchCache.set(url, svg);
    requests.delete(url);
    return svg;
  };
  let promise = request();
  requests.set(url, promise);
  return await promise;
}

const splitAttrsTokenizer = /([a-z0-9_\:\-]*)\s*?=\s*?(['"]?)(.*?)\2\s+/gim;
const domParserTokenizer = /(?:<(\/?)([a-zA-Z][a-zA-Z0-9\:]*)(?:\s([^>]*?))?((?:\s*\/)?)>|(<\!\-\-)([\s\S]*?)(\-\->)|(<\!\[CDATA\[)([\s\S]*?)(\]\]>))/gm;
const splitAttrs = (str) => {
  let res = {};
  let token;
  if (str) {
    splitAttrsTokenizer.lastIndex = 0;
    str = " " + (str || "") + " ";
    while (token = splitAttrsTokenizer.exec(str)) {
      res[token[1]] = token[3];
    }
  }
  return res;
};
function optimizeSvg(contents, name, options) {
  return optimize(contents, {
    plugins: [
      "removeDoctype",
      "removeXMLProcInst",
      "removeComments",
      "removeMetadata",
      "removeXMLNS",
      "removeEditorsNSData",
      "cleanupAttrs",
      "minifyStyles",
      "convertStyleToAttrs",
      {
        name: "cleanupIDs",
        params: { prefix: `${SPRITESHEET_NAMESPACE}:${name}` }
      },
      "removeRasterImages",
      "removeUselessDefs",
      "cleanupNumericValues",
      "cleanupListOfValues",
      "convertColors",
      "removeUnknownsAndDefaults",
      "removeNonInheritableGroupAttrs",
      "removeUselessStrokeAndFill",
      "removeViewBox",
      "cleanupEnableBackground",
      "removeHiddenElems",
      "removeEmptyText",
      "convertShapeToPath",
      "moveElemsAttrsToGroup",
      "moveGroupAttrsToElems",
      "collapseGroups",
      "convertPathData",
      "convertTransform",
      "removeEmptyAttrs",
      "removeEmptyContainers",
      "mergePaths",
      "removeUnusedNS",
      "sortAttrs",
      "removeTitle",
      "removeDesc",
      "removeDimensions",
      "removeStyleElement",
      "removeScriptElement"
    ]
  }).data;
}
const preprocessCache = /* @__PURE__ */ new Map();
function preprocess(contents, name, { optimize }) {
  if (preprocessCache.has(contents)) {
    return preprocessCache.get(contents);
  }
  if (optimize) {
    contents = optimizeSvg(contents, name);
  }
  domParserTokenizer.lastIndex = 0;
  let result = contents;
  let token;
  if (contents) {
    while (token = domParserTokenizer.exec(contents)) {
      const tag = token[2];
      if (tag === "svg") {
        const attrs = splitAttrs(token[3]);
        result = contents.slice(domParserTokenizer.lastIndex).replace(/<\/svg>/gim, "").trim();
        const value = { innerHTML: result, defaultProps: attrs };
        preprocessCache.set(contents, value);
        return value;
      }
    }
  }
}
function normalizeProps(inputProps) {
  const size = inputProps.size;
  delete inputProps.size;
  const w = inputProps.width ?? size;
  const h = inputProps.height ?? size;
  const width = w ? toAttributeSize(w) : void 0;
  const height = h ? toAttributeSize(h) : void 0;
  return { ...inputProps, width, height };
}
const toAttributeSize = (size) => String(size).replace(/(?<=[0-9])x$/, "em");
const fallback = {
  innerHTML: '<rect width="24" height="24" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" />',
  props: {
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    "aria-hidden": "true"
  }
};
async function load(name, inputProps, optimize) {
  const key = name;
  if (!name) {
    throw new Error("<Icon> requires a name!");
  }
  let svg = "";
  let filepath = "";
  if (name.includes(":")) {
    const [pack, ..._name] = name.split(":");
    name = _name.join(":");
    filepath = `/src/icons/${pack}`;
    let get$1;
    try {
      const files = /* #__PURE__ */ Object.assign({});
      const keys = Object.fromEntries(
        Object.keys(files).map((key2) => [key2.replace(/\.[cm]?[jt]s$/, ""), key2])
      );
      if (!(filepath in keys)) {
        throw new Error(`Could not find the file "${filepath}"`);
      }
      const mod = files[keys[filepath]];
      if (typeof mod.default !== "function") {
        throw new Error(
          `[astro-icon] "${filepath}" did not export a default function!`
        );
      }
      get$1 = mod.default;
    } catch (e) {
    }
    if (typeof get$1 === "undefined") {
      get$1 = get.bind(null, pack);
    }
    const contents = await get$1(name);
    if (!contents) {
      throw new Error(
        `<Icon pack="${pack}" name="${name}" /> did not return an icon!`
      );
    }
    if (!/<svg/gim.test(contents)) {
      throw new Error(
        `Unable to process "<Icon pack="${pack}" name="${name}" />" because an SVG string was not returned!

Recieved the following content:
${contents}`
      );
    }
    svg = contents;
  } else {
    filepath = `/src/icons/${name}.svg`;
    try {
      const files = /* #__PURE__ */ Object.assign({"/src/icons/frameworks/lit.svg": __vite_glob_1_0,"/src/icons/frameworks/preact.svg": __vite_glob_1_1,"/src/icons/frameworks/react.svg": __vite_glob_1_2,"/src/icons/frameworks/solid.svg": __vite_glob_1_3,"/src/icons/frameworks/svelte.svg": __vite_glob_1_4,"/src/icons/frameworks/vue.svg": __vite_glob_1_5,"/src/icons/logomark.svg": __vite_glob_1_6,"/src/icons/platforms/netlify.svg": __vite_glob_1_7,"/src/icons/platforms/render.svg": __vite_glob_1_8,"/src/icons/platforms/vercel.svg": __vite_glob_1_9,"/src/icons/theme/dark.svg": __vite_glob_1_10,"/src/icons/theme/light.svg": __vite_glob_1_11,"/src/icons/wordmark.svg": __vite_glob_1_12});
      if (!(filepath in files)) {
        throw new Error(`Could not find the file "${filepath}"`);
      }
      const contents = files[filepath];
      if (!/<svg/gim.test(contents)) {
        throw new Error(
          `Unable to process "${filepath}" because it is not an SVG!

Recieved the following content:
${contents}`
        );
      }
      svg = contents;
    } catch (e) {
      throw new Error(
        `[astro-icon] Unable to load "${filepath}". Does the file exist?`
      );
    }
  }
  const { innerHTML, defaultProps } = preprocess(svg, key, { optimize });
  if (!innerHTML.trim()) {
    throw new Error(`Unable to parse "${filepath}"!`);
  }
  return {
    innerHTML,
    props: { ...defaultProps, ...normalizeProps(inputProps) }
  };
}

const $$module2$6 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  preprocess,
  normalizeProps,
  fallback,
  default: load
}, Symbol.toStringTag, { value: 'Module' }));

const $$module4$3 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: 'Module' }));

createMetadata("/@fs/Volumes/Cache/repos/codos-dio/node_modules/.pnpm/astro-icon@0.7.3/node_modules/astro-icon/lib/Icon.astro", { modules: [{ module: $$module2$6, specifier: "./utils.ts", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$i = createAstro("/@fs/Volumes/Cache/repos/codos-dio/node_modules/.pnpm/astro-icon@0.7.3/node_modules/astro-icon/lib/Icon.astro", "https://dio.codos.co.nz/", "file:///Volumes/Cache/repos/codos-dio/");
const $$Icon = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$i, $$props, $$slots);
  Astro2.self = $$Icon;
  let { name, pack, title, optimize = true, class: className, ...inputProps } = Astro2.props;
  let props = {};
  if (pack) {
    name = `${pack}:${name}`;
  }
  let innerHTML = "";
  try {
    const svg = await load(name, { ...inputProps, class: className }, optimize);
    innerHTML = svg.innerHTML;
    props = svg.props;
  } catch (e) {
    {
      throw new Error(`[astro-icon] Unable to load icon "${name}"!
${e}`);
    }
  }
  return renderTemplate`${maybeRenderHead($$result)}<svg${spreadAttributes(props)}${addAttribute(name, "astro-icon")}>${markHTMLString((title ? `<title>${title}</title>` : "") + innerHTML)}</svg>`;
});

const AstroIcon = Symbol("AstroIcon");
function trackSprite(result, name) {
  if (typeof result[AstroIcon] !== "undefined") {
    result[AstroIcon]["sprites"].add(name);
  } else {
    result[AstroIcon] = {
      sprites: /* @__PURE__ */ new Set([name])
    };
  }
}
const warned = /* @__PURE__ */ new Set();
async function getUsedSprites(result) {
  if (typeof result[AstroIcon] !== "undefined") {
    return Array.from(result[AstroIcon]["sprites"]);
  }
  const pathname = result._metadata.pathname;
  if (!warned.has(pathname)) {
    console.log(`[astro-icon] No sprites found while rendering "${pathname}"`);
    warned.add(pathname);
  }
  return [];
}

const $$module3$3 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  trackSprite,
  getUsedSprites
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata$d = createMetadata("/@fs/Volumes/Cache/repos/codos-dio/node_modules/.pnpm/astro-icon@0.7.3/node_modules/astro-icon/lib/Spritesheet.astro", { modules: [{ module: $$module1$4, specifier: "./constants", assert: {} }, { module: $$module2$6, specifier: "./utils.ts", assert: {} }, { module: $$module3$3, specifier: "./context.ts", assert: {} }, { module: $$module4$3, specifier: "./Props.ts", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$h = createAstro("/@fs/Volumes/Cache/repos/codos-dio/node_modules/.pnpm/astro-icon@0.7.3/node_modules/astro-icon/lib/Spritesheet.astro", "https://dio.codos.co.nz/", "file:///Volumes/Cache/repos/codos-dio/");
const $$Spritesheet = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$h, $$props, $$slots);
  Astro2.self = $$Spritesheet;
  const { optimize = true, style, ...props } = Astro2.props;
  const names = await getUsedSprites($$result);
  const icons = await Promise.all(names.map((name) => {
    return load(name, {}, optimize).then((res) => ({ ...res, name })).catch((e) => {
      {
        throw new Error(`[astro-icon] Unable to load icon "${name}"!
${e}`);
      }
    });
  }));
  return renderTemplate`${maybeRenderHead($$result)}<svg${addAttribute(`display: none; ${style ?? ""}`.trim(), "style")}${spreadAttributes({ "aria-hidden": true, ...props })} astro-icon-spritesheet>
    ${icons.map((icon) => renderTemplate`<symbol${spreadAttributes(icon.props)}${addAttribute(`${SPRITESHEET_NAMESPACE}:${icon.name}`, "id")}>${markHTMLString(icon.innerHTML)}</symbol>`)}
</svg>`;
});

const $$file$d = "/Volumes/Cache/repos/codos-dio/node_modules/.pnpm/astro-icon@0.7.3/node_modules/astro-icon/lib/Spritesheet.astro";
const $$url$d = undefined;

const $$module1$3 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  $$metadata: $$metadata$d,
  default: $$Spritesheet,
  file: $$file$d,
  url: $$url$d
}, Symbol.toStringTag, { value: 'Module' }));

createMetadata("/@fs/Volumes/Cache/repos/codos-dio/node_modules/.pnpm/astro-icon@0.7.3/node_modules/astro-icon/lib/SpriteProvider.astro", { modules: [{ module: $$module1$3, specifier: "./Spritesheet.astro", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$g = createAstro("/@fs/Volumes/Cache/repos/codos-dio/node_modules/.pnpm/astro-icon@0.7.3/node_modules/astro-icon/lib/SpriteProvider.astro", "https://dio.codos.co.nz/", "file:///Volumes/Cache/repos/codos-dio/");
const $$SpriteProvider = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$g, $$props, $$slots);
  Astro2.self = $$SpriteProvider;
  const content = await Astro2.slots.render("default");
  return renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": () => renderTemplate`${markHTMLString(content)}` })}
${renderComponent($$result, "Spritesheet", $$Spritesheet, {})}
`;
});

createMetadata("/@fs/Volumes/Cache/repos/codos-dio/node_modules/.pnpm/astro-icon@0.7.3/node_modules/astro-icon/lib/Sprite.astro", { modules: [{ module: $$module1$4, specifier: "./constants", assert: {} }, { module: $$module2$6, specifier: "./utils.ts", assert: {} }, { module: $$module3$3, specifier: "./context.ts", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$f = createAstro("/@fs/Volumes/Cache/repos/codos-dio/node_modules/.pnpm/astro-icon@0.7.3/node_modules/astro-icon/lib/Sprite.astro", "https://dio.codos.co.nz/", "file:///Volumes/Cache/repos/codos-dio/");
const $$Sprite = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$f, $$props, $$slots);
  Astro2.self = $$Sprite;
  let { name, pack, title, class: className, x, y, ...inputProps } = Astro2.props;
  const props = normalizeProps(inputProps);
  if (pack) {
    name = `${pack}:${name}`;
  }
  const href = `#${SPRITESHEET_NAMESPACE}:${name}`;
  trackSprite($$result, name);
  return renderTemplate`${maybeRenderHead($$result)}<svg${spreadAttributes(props)}${addAttribute(className, "class")}${addAttribute(name, "astro-icon")}>
    ${title ? renderTemplate`<title>${title}</title>` : ""}
    <use${spreadAttributes({ "xlink:href": href, width: props.width, height: props.height, x, y })}></use>
</svg>`;
});

const deprecate = (component, message) => {
  return (...args) => {
    console.warn(message);
    return component(...args);
  };
};
const Spritesheet = deprecate(
  $$Spritesheet,
  `Direct access to <Spritesheet /> has been deprecated! Please wrap your contents in <Sprite.Provider> instead!`
);
const SpriteSheet = deprecate(
  $$Spritesheet,
  `Direct access to <SpriteSheet /> has been deprecated! Please wrap your contents in <Sprite.Provider> instead!`
);
const Sprite = Object.assign($$Sprite, { Provider: $$SpriteProvider });

const $$module2$5 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Icon,
  Icon: $$Icon,
  Spritesheet,
  SpriteSheet,
  SpriteProvider: $$SpriteProvider,
  Sprite
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata$c = createMetadata("/@fs/Volumes/Cache/repos/codos-dio/src/components/compatibility-list.astro", { modules: [{ module: $$module2$5, specifier: "astro-icon", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$e = createAstro("/@fs/Volumes/Cache/repos/codos-dio/src/components/compatibility-list.astro", "https://dio.codos.co.nz/", "file:///Volumes/Cache/repos/codos-dio/");
const $$CompatibilityList = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$e, $$props, $$slots);
  Astro2.self = $$CompatibilityList;
  const { title, data, url } = Astro2.props;
  return renderTemplate`${maybeRenderHead($$result)}<div class="w-full max-w-6xl space-y-2">
  <div class="relative px-6 pt-8 pb-4 border bg-offset border-default">
    <h3 class="absolute top-0 px-4 py-1 text-xs tracking-tight uppercase -translate-y-1/2 border border-current rounded-full right-4 bg-default">
      ${title}
    </h3>
    <ul class="grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-6">
      ${data.map(({ title: title2, icon, url: url2 }) => renderTemplate`<li>
            <a class="flex flex-col items-center gap-2"${addAttribute(url2, "href")}>
              ${renderComponent($$result, "Icon", $$Icon, { "class": "h-12", "name": icon })}
              <span>${title2}</span>
            </a>
          </li>`)}
    </ul>
  </div>
  <p class="text-sm text-right">
    <a class="text-primary"${addAttribute(url, "href")}> ...and more &rarr;</a>
  </p>
</div>`;
});

const $$file$c = "/Volumes/Cache/repos/codos-dio/src/components/compatibility-list.astro";
const $$url$c = undefined;

const $$module2$4 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  $$metadata: $$metadata$c,
  default: $$CompatibilityList,
  file: $$file$c,
  url: $$url$c
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata$b = createMetadata("/@fs/Volumes/Cache/repos/codos-dio/src/components/aboutus.astro", { modules: [{ module: $$module1$5, specifier: "~/components/content-section.astro", assert: {} }, { module: $$module2$4, specifier: "~/components/compatibility-list.astro", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$d = createAstro("/@fs/Volumes/Cache/repos/codos-dio/src/components/aboutus.astro", "https://dio.codos.co.nz/", "file:///Volumes/Cache/repos/codos-dio/");
const $$Aboutus = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$d, $$props, $$slots);
  Astro2.self = $$Aboutus;
  const frameworks = [
    {
      title: "React",
      icon: "frameworks/react",
      url: "https://reactjs.org/"
    },
    {
      title: "Preact",
      icon: "frameworks/preact",
      url: "https://preactjs.com/"
    },
    {
      title: "Svelte",
      icon: "frameworks/svelte",
      url: "https://svelte.dev/"
    },
    {
      title: "Vue",
      icon: "frameworks/vue",
      url: "https://vuejs.org/"
    },
    {
      title: "Solid",
      icon: "frameworks/solid",
      url: "https://www.solidjs.com/"
    },
    {
      title: "Lit",
      icon: "frameworks/lit",
      url: "https://lit.dev/"
    }
  ];
  const platforms = [
    {
      title: "Netlify",
      icon: "platforms/netlify",
      url: "https://www.netlify.com/"
    },
    {
      title: "Vercel",
      icon: "platforms/vercel",
      url: "https://vercel.com/"
    },
    {
      title: "Cloudflare",
      icon: "fa-brands:cloudflare",
      url: "https://pages.cloudflare.com/"
    },
    {
      title: "Render",
      icon: "platforms/render",
      url: "https://render.com/"
    },
    {
      title: "GitHub",
      icon: "fa-brands:github",
      url: "https://pages.github.com/"
    },
    {
      title: "GitLab",
      icon: "fa-brands:gitlab",
      url: "https://docs.gitlab.com/ee/user/project/pages/"
    }
  ];
  return renderTemplate`${renderComponent($$result, "ContentSection", $$ContentSection, { "title": "About Us", "id": "about-us" }, { "default": () => renderTemplate`${renderComponent($$result, "CompatibilityList", $$CompatibilityList, { "title": "Frameworks", "data": frameworks, "url": "https://codos.co.nz" })}${renderComponent($$result, "CompatibilityList", $$CompatibilityList, { "title": "Platforms", "data": platforms, "url": "https://codos.co.nz" })}`, "lead": () => renderTemplate`${renderComponent($$result, "Fragment", Fragment, { "slot": "lead" }, { "default": () => renderTemplate`
    At ${maybeRenderHead($$result)}<span class="text-primary">CODOS</span>${" "}we offer${" "}<span class="text-primary">professionally designed websites </span>
    on time at a great price that suits your budget.
  ` })}` })}`;
});

const $$file$b = "/Volumes/Cache/repos/codos-dio/src/components/aboutus.astro";
const $$url$b = undefined;

const $$module1$2 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  $$metadata: $$metadata$b,
  default: $$Aboutus,
  file: $$file$b,
  url: $$url$b
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata$a = createMetadata("/@fs/Volumes/Cache/repos/codos-dio/src/components/events.astro", { modules: [{ module: $$module1$5, specifier: "~/components/content-section.astro", assert: {} }, { module: $$module2$5, specifier: "astro-icon", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$c = createAstro("/@fs/Volumes/Cache/repos/codos-dio/src/components/events.astro", "https://dio.codos.co.nz/", "file:///Volumes/Cache/repos/codos-dio/");
const $$Events = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$c, $$props, $$slots);
  Astro2.self = $$Events;
  const events = [
    {
      title: "Bring Your Own Framework",
      description: "Build your site using React, Svelte, Vue, Preact, web components, or just plain ol' HTML + JavaScript.",
      icon: "mdi:handshake"
    },
    {
      title: "100% Static HTML, No JS",
      description: "Astro renders your entire page to static HTML, removing all JavaScript from your final build by default.",
      icon: "mdi:feather"
    },
    {
      title: "On-Demand Components",
      description: "Need some JS? Astro can automatically hydrate interactive components when they become visible on the page. If the user never sees it, they never load it.",
      icon: "mdi:directions-fork"
    },
    {
      title: "Broad Integration",
      description: "Astro supports TypeScript, Scoped CSS, CSS Modules, Sass, Tailwind, Markdown, MDX, and any of your favorite npm packages.",
      icon: "mdi:graph"
    },
    {
      title: "SEO Enabled",
      description: "Automatic sitemaps, RSS feeds, pagination and collections take the pain out of SEO and syndication.",
      icon: "mdi:search-web"
    },
    {
      title: "Community",
      description: "Astro is an open source project powered by hundreds of contributors making thousands of individual contributions.",
      icon: "mdi:account-group"
    }
  ];
  return renderTemplate`${renderComponent($$result, "ContentSection", $$ContentSection, { "title": "Events", "id": "events" }, { "default": () => renderTemplate`${maybeRenderHead($$result)}<ul class="grid max-w-6xl grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
    ${events.map(({ title, description, icon }) => renderTemplate`<li class="flex flex-col items-center gap-4 p-6 border border-default bg-offset">
          <div class="w-16 h-16 p-3 border-2 border-current rounded-full">
            ${renderComponent($$result, "Icon", $$Icon, { "name": icon })}
          </div>
          <p class="text-xl font-extrabold text-center">${title}</p>
          <p class="text-sm text-center text-offset">${description}</p>
        </li>`)}
  </ul>`, "lead": () => renderTemplate`${renderComponent($$result, "Fragment", Fragment, { "slot": "lead" }, { "default": () => renderTemplate`
    CODOS comes <span class="text-primary">batteries included</span>. It takes
    the best parts of
    <span class="text-primary">state-of-the-art</span>
    tools and adds our own <span class="text-primary">ingenuity</span>.
  ` })}` })}`;
});

const $$file$a = "/Volumes/Cache/repos/codos-dio/src/components/events.astro";
const $$url$a = undefined;

const $$module2$3 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  $$metadata: $$metadata$a,
  default: $$Events,
  file: $$file$a,
  url: $$url$a
}, Symbol.toStringTag, { value: 'Module' }));

async function loadLocalImage(src) {
  try {
    return await fs.readFile(src);
  } catch {
    return void 0;
  }
}
async function loadRemoteImage(src) {
  try {
    const res = await fetch(src);
    if (!res.ok) {
      return void 0;
    }
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return void 0;
  }
}

const PREFIX = "@astrojs/image";
const dateTimeFormat = new Intl.DateTimeFormat([], {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit"
});
const levels = {
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  silent: 90
};
function getPrefix(level, timestamp) {
  let prefix = "";
  if (timestamp) {
    prefix += dim(dateTimeFormat.format(new Date()) + " ");
  }
  switch (level) {
    case "debug":
      prefix += bold(green(`[${PREFIX}] `));
      break;
    case "info":
      prefix += bold(cyan(`[${PREFIX}] `));
      break;
    case "warn":
      prefix += bold(yellow(`[${PREFIX}] `));
      break;
    case "error":
      prefix += bold(red(`[${PREFIX}] `));
      break;
  }
  return prefix;
}
const log = (_level, dest) => ({ message, level, prefix = true, timestamp = true }) => {
  if (levels[_level] >= levels[level]) {
    dest(`${prefix ? getPrefix(level, timestamp) : ""}${message}`);
  }
};
const info = log("info", console.info);
const debug = log("debug", console.debug);
const warn = log("warn", console.warn);

function getTimeStat(timeStart, timeEnd) {
  const buildTime = timeEnd - timeStart;
  return buildTime < 750 ? `${Math.round(buildTime)}ms` : `${(buildTime / 1e3).toFixed(2)}s`;
}
async function ssgBuild({ loader, staticImages, config, outDir, logLevel }) {
  const timer = performance.now();
  const cpuCount = OS.cpus().length;
  info({
    level: logLevel,
    prefix: false,
    message: `${bgGreen(
      black(
        ` optimizing ${staticImages.size} image${staticImages.size > 1 ? "s" : ""} in batches of ${cpuCount} `
      )
    )}`
  });
  const inputFiles = /* @__PURE__ */ new Set();
  async function processStaticImage([src, transformsMap]) {
    let inputFile = void 0;
    let inputBuffer = void 0;
    if (config.base && src.startsWith(config.base)) {
      src = src.substring(config.base.length - 1);
    }
    if (isRemoteImage(src)) {
      inputBuffer = await loadRemoteImage(src);
    } else {
      const inputFileURL = new URL(`.${src}`, outDir);
      inputFile = fileURLToPath(inputFileURL);
      inputBuffer = await loadLocalImage(inputFile);
      inputFiles.add(inputFile);
    }
    if (!inputBuffer) {
      warn({ level: logLevel, message: `"${src}" image could not be fetched` });
      return;
    }
    const transforms = Array.from(transformsMap.entries());
    debug({ level: logLevel, prefix: false, message: `${green("\u25B6")} transforming ${src}` });
    let timeStart = performance.now();
    for (const [filename, transform] of transforms) {
      timeStart = performance.now();
      let outputFile;
      if (isRemoteImage(src)) {
        const outputFileURL = new URL(path.join("./assets", path.basename(filename)), outDir);
        outputFile = fileURLToPath(outputFileURL);
      } else {
        const outputFileURL = new URL(path.join("./assets", filename), outDir);
        outputFile = fileURLToPath(outputFileURL);
      }
      const { data } = await loader.transform(inputBuffer, transform);
      await fs.writeFile(outputFile, data);
      const timeEnd = performance.now();
      const timeChange = getTimeStat(timeStart, timeEnd);
      const timeIncrease = `(+${timeChange})`;
      const pathRelative = outputFile.replace(fileURLToPath(outDir), "");
      debug({
        level: logLevel,
        prefix: false,
        message: `  ${cyan("created")} ${dim(pathRelative)} ${dim(timeIncrease)}`
      });
    }
  }
  await doWork(cpuCount, staticImages, processStaticImage);
  info({
    level: logLevel,
    prefix: false,
    message: dim(`Completed in ${getTimeStat(timer, performance.now())}.
`)
  });
}

async function metadata(src) {
  const file = await fs.readFile(src);
  const { width, height, type, orientation } = await sizeOf(file);
  const isPortrait = (orientation || 0) >= 5;
  if (!width || !height || !type) {
    return void 0;
  }
  return {
    src: fileURLToPath(src),
    width: isPortrait ? height : width,
    height: isPortrait ? width : height,
    format: type
  };
}

function createPlugin(config, options) {
  const filter = (id) => /^(?!\/_image?).*.(heic|heif|avif|jpeg|jpg|png|tiff|webp|gif)$/.test(id);
  const virtualModuleId = "virtual:image-loader";
  let resolvedConfig;
  return {
    name: "@astrojs/image",
    enforce: "pre",
    configResolved(viteConfig) {
      resolvedConfig = viteConfig;
    },
    async resolveId(id) {
      if (id === virtualModuleId) {
        return await this.resolve(options.serviceEntryPoint);
      }
    },
    async load(id) {
      if (!filter(id)) {
        return null;
      }
      const url = pathToFileURL(id);
      const meta = await metadata(url);
      if (!meta) {
        return;
      }
      if (!this.meta.watchMode) {
        const pathname = decodeURI(url.pathname);
        const filename = basename$1(pathname, extname$1(pathname) + `.${meta.format}`);
        const handle = this.emitFile({
          name: filename,
          source: await fs.readFile(url),
          type: "asset"
        });
        meta.src = `__ASTRO_IMAGE_ASSET__${handle}__`;
      } else {
        const relId = path.relative(fileURLToPath(config.srcDir), id);
        meta.src = join("/@astroimage", relId);
        meta.src = slash(meta.src);
      }
      return `export default ${JSON.stringify(meta)}`;
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        var _a;
        if ((_a = req.url) == null ? void 0 : _a.startsWith("/@astroimage/")) {
          const [, id] = req.url.split("/@astroimage/");
          const url = new URL(id, config.srcDir);
          const file = await fs.readFile(url);
          const meta = await metadata(url);
          if (!meta) {
            return next();
          }
          const transform = await sharp_default.parseTransform(url.searchParams);
          if (!transform) {
            return next();
          }
          const result = await sharp_default.transform(file, transform);
          res.setHeader("Content-Type", `image/${result.format}`);
          res.setHeader("Cache-Control", "max-age=360000");
          const stream = Readable.from(result.data);
          return stream.pipe(res);
        }
        return next();
      });
    },
    async renderChunk(code) {
      const assetUrlRE = /__ASTRO_IMAGE_ASSET__([a-z\d]{8})__(?:_(.*?)__)?/g;
      let match;
      let s;
      while (match = assetUrlRE.exec(code)) {
        s = s || (s = new MagicString(code));
        const [full, hash, postfix = ""] = match;
        const file = this.getFileName(hash);
        const outputFilepath = resolvedConfig.base + file + postfix;
        s.overwrite(match.index, match.index + full.length, outputFilepath);
      }
      if (s) {
        return {
          code: s.toString(),
          map: resolvedConfig.build.sourcemap ? s.generateMap({ hires: true }) : null
        };
      } else {
        return null;
      }
    }
  };
}

function resolveSize(transform) {
  if (transform.width && transform.height) {
    return transform;
  }
  if (!transform.width && !transform.height) {
    throw new Error(`"width" and "height" cannot both be undefined`);
  }
  if (!transform.aspectRatio) {
    throw new Error(
      `"aspectRatio" must be included if only "${transform.width ? "width" : "height"}" is provided`
    );
  }
  let aspectRatio;
  if (typeof transform.aspectRatio === "number") {
    aspectRatio = transform.aspectRatio;
  } else {
    const [width, height] = transform.aspectRatio.split(":");
    aspectRatio = Number.parseInt(width) / Number.parseInt(height);
  }
  if (transform.width) {
    return {
      ...transform,
      width: transform.width,
      height: Math.round(transform.width / aspectRatio)
    };
  } else if (transform.height) {
    return {
      ...transform,
      width: Math.round(transform.height * aspectRatio),
      height: transform.height
    };
  }
  return transform;
}
async function resolveTransform(input) {
  if (typeof input.src === "string") {
    return resolveSize(input);
  }
  const metadata = "then" in input.src ? (await input.src).default : input.src;
  let { width, height, aspectRatio, background, format = metadata.format, ...rest } = input;
  if (!width && !height) {
    width = metadata.width;
    height = metadata.height;
  } else if (width) {
    let ratio = parseAspectRatio(aspectRatio) || metadata.width / metadata.height;
    height = height || Math.round(width / ratio);
  } else if (height) {
    let ratio = parseAspectRatio(aspectRatio) || metadata.width / metadata.height;
    width = width || Math.round(height * ratio);
  }
  return {
    ...rest,
    src: metadata.src,
    width,
    height,
    aspectRatio,
    format,
    background
  };
}
async function getImage(transform) {
  var _a, _b, _c;
  if (!transform.src) {
    throw new Error("[@astrojs/image] `src` is required");
  }
  let loader = (_a = globalThis.astroImage) == null ? void 0 : _a.loader;
  if (!loader) {
    const { default: mod } = await Promise.resolve().then(() => sharp).catch(() => {
      throw new Error(
        "[@astrojs/image] Builtin image loader not found. (Did you remember to add the integration to your Astro config?)"
      );
    });
    loader = mod;
    globalThis.astroImage = globalThis.astroImage || {};
    globalThis.astroImage.loader = loader;
  }
  const resolved = await resolveTransform(transform);
  const attributes = await loader.getImageAttributes(resolved);
  const isDev = (_b = (Object.assign({"BASE_URL":"/","MODE":"production","DEV":false,"PROD":true},{SSR:true,}))) == null ? void 0 : _b.DEV;
  const isLocalImage = !isRemoteImage(resolved.src);
  const _loader = isDev && isLocalImage ? sharp_default : loader;
  if (!_loader) {
    throw new Error("@astrojs/image: loader not found!");
  }
  const { searchParams } = isSSRService(_loader) ? _loader.serializeTransform(resolved) : sharp_default.serializeTransform(resolved);
  let src;
  if (/^[\/\\]?@astroimage/.test(resolved.src)) {
    src = `${resolved.src}?${searchParams.toString()}`;
  } else {
    searchParams.set("href", resolved.src);
    src = `/_image?${searchParams.toString()}`;
  }
  if ((_c = globalThis.astroImage) == null ? void 0 : _c.addStaticImage) {
    src = globalThis.astroImage.addStaticImage(resolved);
  }
  return {
    ...attributes,
    src
  };
}

async function resolveAspectRatio({ src, aspectRatio }) {
  if (typeof src === "string") {
    return parseAspectRatio(aspectRatio);
  } else {
    const metadata = "then" in src ? (await src).default : src;
    return parseAspectRatio(aspectRatio) || metadata.width / metadata.height;
  }
}
async function resolveFormats({ src, formats }) {
  const unique = new Set(formats);
  if (typeof src === "string") {
    unique.add(extname$1(src).replace(".", ""));
  } else {
    const metadata = "then" in src ? (await src).default : src;
    unique.add(extname$1(metadata.src).replace(".", ""));
  }
  return Array.from(unique).filter(Boolean);
}
async function getPicture(params) {
  const { src, widths, fit, position, background } = params;
  if (!src) {
    throw new Error("[@astrojs/image] `src` is required");
  }
  if (!widths || !Array.isArray(widths)) {
    throw new Error("[@astrojs/image] at least one `width` is required");
  }
  const aspectRatio = await resolveAspectRatio(params);
  if (!aspectRatio) {
    throw new Error("`aspectRatio` must be provided for remote images");
  }
  async function getSource(format) {
    const imgs = await Promise.all(
      widths.map(async (width) => {
        const img = await getImage({
          src,
          format,
          width,
          fit,
          position,
          background,
          height: Math.round(width / aspectRatio)
        });
        return `${img.src} ${width}w`;
      })
    );
    return {
      type: mime.getType(format) || format,
      srcset: imgs.join(",")
    };
  }
  const allFormats = await resolveFormats(params);
  const image = await getImage({
    src,
    width: Math.max(...widths),
    aspectRatio,
    fit,
    position,
    background,
    format: allFormats[allFormats.length - 1]
  });
  const sources = await Promise.all(allFormats.map((format) => getSource(format)));
  return {
    sources,
    image
  };
}

const PKG_NAME = "@astrojs/image";
const ROUTE_PATTERN = "/_image";
function integration(options = {}) {
  const resolvedOptions = {
    serviceEntryPoint: "@astrojs/image/sharp",
    logLevel: "info",
    ...options
  };
  let _config;
  const staticImages = /* @__PURE__ */ new Map();
  function getViteConfiguration() {
    return {
      plugins: [createPlugin(_config, resolvedOptions)],
      optimizeDeps: {
        include: ["image-size", "sharp"]
      },
      ssr: {
        noExternal: ["@astrojs/image", resolvedOptions.serviceEntryPoint]
      }
    };
  }
  return {
    name: PKG_NAME,
    hooks: {
      "astro:config:setup": ({ command, config, updateConfig, injectRoute }) => {
        _config = config;
        updateConfig({ vite: getViteConfiguration() });
        if (command === "dev" || config.output === "server") {
          injectRoute({
            pattern: ROUTE_PATTERN,
            entryPoint: "@astrojs/image/endpoint"
          });
        }
      },
      "astro:build:setup": () => {
        function addStaticImage(transform) {
          const srcTranforms = staticImages.has(transform.src) ? staticImages.get(transform.src) : /* @__PURE__ */ new Map();
          const filename = propsToFilename(transform);
          srcTranforms.set(filename, transform);
          staticImages.set(transform.src, srcTranforms);
          return prependForwardSlash(joinPaths(_config.base, "assets", filename));
        }
        globalThis.astroImage = _config.output === "static" ? {
          addStaticImage
        } : {};
      },
      "astro:build:done": async ({ dir }) => {
        var _a;
        if (_config.output === "static") {
          const loader = (_a = globalThis == null ? void 0 : globalThis.astroImage) == null ? void 0 : _a.loader;
          if (loader && "transform" in loader && staticImages.size > 0) {
            await ssgBuild({
              loader,
              staticImages,
              config: _config,
              outDir: dir,
              logLevel: resolvedOptions.logLevel
            });
          }
        }
      }
    }
  };
}

const $$module1$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: integration,
  getImage,
  getPicture
}, Symbol.toStringTag, { value: 'Module' }));

createMetadata("/@fs/Volumes/Cache/repos/codos-dio/node_modules/.pnpm/@astrojs+image@0.7.0/node_modules/@astrojs/image/components/Image.astro", { modules: [{ module: $$module1$1, specifier: "../dist/index.js", assert: {} }, { module: $$module1, specifier: "./index.js", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$b = createAstro("/@fs/Volumes/Cache/repos/codos-dio/node_modules/.pnpm/@astrojs+image@0.7.0/node_modules/@astrojs/image/components/Image.astro", "https://dio.codos.co.nz/", "file:///Volumes/Cache/repos/codos-dio/");
const $$Image = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$b, $$props, $$slots);
  Astro2.self = $$Image;
  const { loading = "lazy", decoding = "async", ...props } = Astro2.props;
  if (props.alt === void 0 || props.alt === null) {
    warnForMissingAlt();
  }
  const attrs = await getImage(props);
  const STYLES = [];
  for (const STYLE of STYLES)
    $$result.styles.add(STYLE);
  return renderTemplate`${maybeRenderHead($$result)}<img${spreadAttributes(attrs, "attrs", { "class": "astro-UXNKDZ4E" })}${addAttribute(loading, "loading")}${addAttribute(decoding, "decoding")}>

`;
});

createMetadata("/@fs/Volumes/Cache/repos/codos-dio/node_modules/.pnpm/@astrojs+image@0.7.0/node_modules/@astrojs/image/components/Picture.astro", { modules: [{ module: $$module1$1, specifier: "../dist/index.js", assert: {} }, { module: $$module1, specifier: "./index.js", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$a = createAstro("/@fs/Volumes/Cache/repos/codos-dio/node_modules/.pnpm/@astrojs+image@0.7.0/node_modules/@astrojs/image/components/Picture.astro", "https://dio.codos.co.nz/", "file:///Volumes/Cache/repos/codos-dio/");
const $$Picture = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$a, $$props, $$slots);
  Astro2.self = $$Picture;
  const {
    src,
    alt,
    sizes,
    widths,
    aspectRatio,
    fit,
    background,
    position,
    formats = ["avif", "webp"],
    loading = "lazy",
    decoding = "async",
    ...attrs
  } = Astro2.props;
  if (alt === void 0 || alt === null) {
    warnForMissingAlt();
  }
  const { image, sources } = await getPicture({
    src,
    widths,
    formats,
    aspectRatio,
    fit,
    background,
    position
  });
  const STYLES = [];
  for (const STYLE of STYLES)
    $$result.styles.add(STYLE);
  return renderTemplate`${maybeRenderHead($$result)}<picture${spreadAttributes(attrs, "attrs", { "class": "astro-MD3BZF6M" })}>
	${sources.map((attrs2) => renderTemplate`<source${spreadAttributes(attrs2, "attrs", { "class": "astro-MD3BZF6M" })}${addAttribute(sizes, "sizes")}>`)}
	<img${spreadAttributes(image, "image", { "class": "astro-MD3BZF6M" })}${addAttribute(loading, "loading")}${addAttribute(decoding, "decoding")}${addAttribute(alt, "alt")}>
</picture>

`;
});

let altWarningShown = false;
function warnForMissingAlt() {
  if (altWarningShown === true) {
    return;
  }
  altWarningShown = true;
  console.warn(`
[@astrojs/image] "alt" text was not provided for an <Image> or <Picture> component.

A future release of @astrojs/image may throw a build error when "alt" text is missing.

The "alt" attribute holds a text description of the image, which isn't mandatory but is incredibly useful for accessibility. Set to an empty string (alt="") if the image is not a key part of the content (it's decoration or a tracking pixel).
`);
}

const Hero = {"src":"/assets/hero.9b0767a5.webp","width":1920,"height":1080,"format":"webp"};

const $$module2$2 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: Hero
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata$9 = createMetadata("/@fs/Volumes/Cache/repos/codos-dio/src/components/hero-image.astro", { modules: [{ module: $$module1, specifier: "@astrojs/image/components", assert: {} }, { module: $$module2$2, specifier: "~/assets/hero.webp", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$9 = createAstro("/@fs/Volumes/Cache/repos/codos-dio/src/components/hero-image.astro", "https://dio.codos.co.nz/", "file:///Volumes/Cache/repos/codos-dio/");
const $$HeroImage = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$9, $$props, $$slots);
  Astro2.self = $$HeroImage;
  const widths = [400, 800, 1200, 1920, 2560, 3840];
  const sizes = "100vw";
  return renderTemplate`${renderComponent($$result, "Picture", $$Picture, { "src": Hero, "class": "object-cover w-full h-full", "widths": widths, "sizes": sizes, "formats": ["avif", "jpeg", "png", "webp"], "alt": "An image of colour-assorted background" })}`;
});

const $$file$9 = "/Volumes/Cache/repos/codos-dio/src/components/hero-image.astro";
const $$url$9 = undefined;

const $$module4$2 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  $$metadata: $$metadata$9,
  default: $$HeroImage,
  file: $$file$9,
  url: $$url$9
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata$8 = createMetadata("/@fs/Volumes/Cache/repos/codos-dio/src/components/footer.astro", { modules: [{ module: $$module2$5, specifier: "astro-icon", assert: {} }, { module: $$module4$2, specifier: "~/components/hero-image.astro", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$8 = createAstro("/@fs/Volumes/Cache/repos/codos-dio/src/components/footer.astro", "https://dio.codos.co.nz/", "file:///Volumes/Cache/repos/codos-dio/");
const $$Footer = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$8, $$props, $$slots);
  Astro2.self = $$Footer;
  const links = [
    {
      url: "mailto:info@dragitout.co.nz",
      description: "Write to Drag It Out",
      icon: "mdi:email"
    },
    {
      url: "https://facebook.com/Dragitoutchch",
      description: "Drag It Out on Facebook",
      icon: "fa-brands:facebook"
    },
    {
      url: "https://instagram.com/Dragitoutchch",
      description: "Drag It Out on Instagram",
      icon: "fa-brands:instagram"
    }
  ];
  return renderTemplate`${maybeRenderHead($$result)}<footer class="relative flex flex-col items-center justify-center h-64">
  <div class="absolute inset-0 overflow-hidden opacity-40">
    ${renderComponent($$result, "HeroImage", $$HeroImage, {})}
  </div>
  <ul class="relative grid grid-cols-2 gap-3 sm:grid-cols-3">
    ${links.map((link) => renderTemplate`<li>
          <a class="flex items-center justify-center w-16 h-16 p-4 border-2 border-current rounded-full"${addAttribute(link.url, "href")}>
            <span class="sr-only">${link.description}</span>
            ${renderComponent($$result, "Icon", $$Icon, { "class": "h-full", "name": link.icon })}
          </a>
        </li>`)}
  </ul>
  <p>built with ❤ by <a href="https://codos.co.nz">CODOS</a></p>
</footer>`;
});

const $$file$8 = "/Volumes/Cache/repos/codos-dio/src/components/footer.astro";
const $$url$8 = undefined;

const $$module3$2 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  $$metadata: $$metadata$8,
  default: $$Footer,
  file: $$file$8,
  url: $$url$8
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata$7 = createMetadata("/@fs/Volumes/Cache/repos/codos-dio/src/components/theme-switcher.astro", { modules: [{ module: $$module2$5, specifier: "astro-icon", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [{ type: "inline", value: `
  const themes = ["light", "dark"];
  const button = document.querySelector("#theme-switcher");

  const getThemeCurrent = () => document.documentElement.dataset.theme;
  const getThemeNext = () => {
    const themeCurrent = getThemeCurrent();
    const indexThemeCurrent = themes.indexOf(themeCurrent);
    return themes[(indexThemeCurrent + 1) % themes.length];
  };

  const updateIcon = () => {
    const themeCurrent = getThemeCurrent();
    document
      .querySelector(\`#icon-theme-\${themeCurrent}\`)
      .classList.add("hidden");
    const themeNext = getThemeNext();
    document
      .querySelector(\`#icon-theme-\${themeNext}\`)
      .classList.remove("hidden");
  };

  button.addEventListener("click", () => {
    const themeNext = getThemeNext();
    document.documentElement.dataset.theme = themeNext;
    localStorage.setItem("theme", themeNext);
    updateIcon();
  });

  updateIcon();
` }] });
const $$Astro$7 = createAstro("/@fs/Volumes/Cache/repos/codos-dio/src/components/theme-switcher.astro", "https://dio.codos.co.nz/", "file:///Volumes/Cache/repos/codos-dio/");
const $$ThemeSwitcher = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$7, $$props, $$slots);
  Astro2.self = $$ThemeSwitcher;
  const STYLES = [];
  for (const STYLE of STYLES)
    $$result.styles.add(STYLE);
  return renderTemplate`<!--
  negative margin is sum of button width (8) and gap size of flex parent (6)
  TODO don't hardcode these values
-->${maybeRenderHead($$result)}<button id="theme-switcher" type="button" class="scale-0 transition-all origin-[right_center] duration-500 -ml-14 astro-QW5OU4EC">
  <div id="icon-theme-light" class="astro-QW5OU4EC">
    ${renderComponent($$result, "Icon", $$Icon, { "name": "theme/light", "class": "h-8 astro-QW5OU4EC" })}
    <span class="sr-only astro-QW5OU4EC">Use light theme</span>
  </div>
  <div id="icon-theme-dark" class="hidden astro-QW5OU4EC">
    ${renderComponent($$result, "Icon", $$Icon, { "name": "theme/dark", "class": "h-8 astro-QW5OU4EC" })}
    <span class="sr-only astro-QW5OU4EC">Use dark theme</span>
  </div>
</button>



`;
});

const $$file$7 = "/Volumes/Cache/repos/codos-dio/src/components/theme-switcher.astro";
const $$url$7 = undefined;

const $$module2$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  $$metadata: $$metadata$7,
  default: $$ThemeSwitcher,
  file: $$file$7,
  url: $$url$7
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata$6 = createMetadata("/@fs/Volumes/Cache/repos/codos-dio/src/components/header.astro", { modules: [{ module: $$module2$5, specifier: "astro-icon", assert: {} }, { module: $$module2$1, specifier: "~/components/theme-switcher.astro", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [{ type: "inline", value: `
  import MicroModal from "micromodal";

  const menuModalId = "menu-modal";

  const header: HTMLElement = document.querySelector("#page-header");
  const page = document.documentElement;
  const menu = document.querySelector(\`#\${menuModalId} ul\`);
  const openNavButton = document.querySelector("#open-nav-button");
  const closeNavButton = document.querySelector("#close-nav-button");

  const openMenu = () => {
    MicroModal.show(menuModalId, { disableScroll: true });
  };

  const closeMenu = () => {
    MicroModal.close(menuModalId);
  };

  openNavButton.addEventListener("click", openMenu);
  closeNavButton.addEventListener("click", closeMenu);

  document.addEventListener("scroll", () => {
    const d = page.clientHeight - page.scrollTop - header.offsetHeight;
    header.classList.toggle("fixed-header", d < 0);
  });

  menu.addEventListener("click", (event) => {
    if ((event.target as HTMLElement).tagName === "A") {
      closeMenu();
    }
  });
` }] });
const $$Astro$6 = createAstro("/@fs/Volumes/Cache/repos/codos-dio/src/components/header.astro", "https://dio.codos.co.nz/", "file:///Volumes/Cache/repos/codos-dio/");
const $$Header = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$6, $$props, $$slots);
  Astro2.self = $$Header;
  const navItems = [
    { title: "Events", url: "#events" },
    { title: "About Us ", url: "#about-us" },
    { title: "Contact", url: "#contact" }
  ];
  const STYLES = [];
  for (const STYLE of STYLES)
    $$result.styles.add(STYLE);
  return renderTemplate`${maybeRenderHead($$result)}<header id="page-header" class="absolute bottom-0 z-10 flex items-center justify-between w-full px-8 py-4 text-white border-b border-transparent astro-EEH7Q7WK">
  <a class="flex items-center gap-3 hover:!text-default astro-EEH7Q7WK" href="#">
    <h1 class="sr-only astro-EEH7Q7WK">Drag It Out</h1>
    ${renderComponent($$result, "Icon", $$Icon, { "name": "wordmark", "class": "hidden h-10 sm:block astro-EEH7Q7WK" })}
  </a>
  <div class="astro-EEH7Q7WK">
    <div class="flex items-center gap-6 astro-EEH7Q7WK">
      <nav class="hidden sm:block astro-EEH7Q7WK">
        <ul class="flex items-center gap-6 astro-EEH7Q7WK">
          ${navItems.map(({ title, url }) => renderTemplate`<li class="astro-EEH7Q7WK">
                <a class="text-sm astro-EEH7Q7WK"${addAttribute(url, "href")}>
                  ${title}
                </a>
              </li>`)}
        </ul>
      </nav>
      <button id="open-nav-button" type="button" class="btn sm:hidden astro-EEH7Q7WK" aria-label="Navigation">
        ${renderComponent($$result, "Icon", $$Icon, { "pack": "mdi", "name": "menu", "class": "h-8 astro-EEH7Q7WK" })}
      </button>
      ${renderComponent($$result, "ThemeSwitcher", $$ThemeSwitcher, { "class": "astro-EEH7Q7WK" })}
    </div>
    <div id="menu-modal" class="hidden modal astro-EEH7Q7WK" aria-hidden="true">
      <div class="fixed inset-0 px-8 py-4 bg-default text-default astro-EEH7Q7WK">
        <div class="space-y-4 astro-EEH7Q7WK" role="dialog" aria-modal="true">
          <header class="text-right astro-EEH7Q7WK">
            <button id="close-nav-button" type="button" class="btn astro-EEH7Q7WK" aria-label="Close navigation">
              ${renderComponent($$result, "Icon", $$Icon, { "pack": "mdi", "name": "close", "class": "h-8 astro-EEH7Q7WK" })}
            </button>
          </header>
          <div class="flex justify-center astro-EEH7Q7WK">
            ${renderComponent($$result, "Icon", $$Icon, { "name": "wordmark", "class": "h-16 astro-EEH7Q7WK" })}
          </div>
          <nav class="astro-EEH7Q7WK">
            <ul class="flex flex-col astro-EEH7Q7WK">
              ${navItems.map(({ title, url }) => renderTemplate`<li class="astro-EEH7Q7WK">
                    <a class="block py-4 text-xl text-center astro-EEH7Q7WK"${addAttribute(url, "href")}>
                      ${title}
                    </a>
                  </li>`)}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  </div>
</header>



<noscript>
  <style>
    #open-nav-button {
      display: none;
    }
  </style>
</noscript>

`;
});

const $$file$6 = "/Volumes/Cache/repos/codos-dio/src/components/header.astro";
const $$url$6 = undefined;

const $$module4$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  $$metadata: $$metadata$6,
  default: $$Header,
  file: $$file$6,
  url: $$url$6
}, Symbol.toStringTag, { value: 'Module' }));

const Wordmark = {"src":"/assets/wordmark.3659e8e0.webp","width":5700,"height":926,"format":"webp"};

const $$module4 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: Wordmark
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata$5 = createMetadata("/@fs/Volumes/Cache/repos/codos-dio/src/components/intro.astro", { modules: [{ module: $$module2$5, specifier: "astro-icon", assert: {} }, { module: $$module1, specifier: "@astrojs/image/components", assert: {} }, { module: $$module1$5, specifier: "~/components/content-section.astro", assert: {} }, { module: $$module4, specifier: "~/assets/wordmark.webp", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$5 = createAstro("/@fs/Volumes/Cache/repos/codos-dio/src/components/intro.astro", "https://dio.codos.co.nz/", "file:///Volumes/Cache/repos/codos-dio/");
const $$Intro = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$5, $$props, $$slots);
  Astro2.self = $$Intro;
  const widths = [400, 600];
  const sizes = "50vw";
  return renderTemplate`${renderComponent($$result, "ContentSection", $$ContentSection, { "title": "", "id": "intro" }, { "default": () => renderTemplate`${maybeRenderHead($$result)}<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
    <a href="https://codos.co.nz" class="flex items-center justify-center gap-3 px-6 py-4 border-2 border-current">
      ${renderComponent($$result, "Icon", $$Icon, { "pack": "mdi", "name": "telescope", "class": "h-8" })}
      <span>Read the docs</span>
    </a>
    <a href="https://codos.co.nz" class="flex items-center justify-center gap-3 px-6 py-4 border-2 border-current">
      ${renderComponent($$result, "Icon", $$Icon, { "pack": "mdi", "name": "rocket", "class": "h-8" })}
      <span>Try it out</span>
    </a>
  </div>`, "eyebrow": () => renderTemplate`${renderComponent($$result, "Fragment", Fragment, { "slot": "eyebrow" }, { "default": () => renderTemplate`${renderComponent($$result, "Picture", $$Picture, { "src": Wordmark, "class": "object-cover w-50", "widths": widths, "sizes": sizes, "formats": ["avif", "jpeg", "png", "webp"], "alt": "A wordmark of Drag It Out" })}` })}`, "lead": () => renderTemplate`${renderComponent($$result, "Fragment", Fragment, { "slot": "lead" }, { "default": () => renderTemplate`
    CODOS offers a new kind of site builder for the
    <span class="text-primary">modern</span> web.
    <span class="text-primary">Lightning-fast</span>
    performance meets <span class="text-primary">amazing</span> end-user experience.
  ` })}` })}`;
});

const $$file$5 = "/Volumes/Cache/repos/codos-dio/src/components/intro.astro";
const $$url$5 = undefined;

const $$module5$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  $$metadata: $$metadata$5,
  default: $$Intro,
  file: $$file$5,
  url: $$url$5
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata$4 = createMetadata("/@fs/Volumes/Cache/repos/codos-dio/src/components/showcase-card.astro", { modules: [], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$4 = createAstro("/@fs/Volumes/Cache/repos/codos-dio/src/components/showcase-card.astro", "https://dio.codos.co.nz/", "file:///Volumes/Cache/repos/codos-dio/");
const $$ShowcaseCard = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$4, $$props, $$slots);
  Astro2.self = $$ShowcaseCard;
  const { title, image, url } = Astro2.props;
  return renderTemplate`${maybeRenderHead($$result)}<a class="group aspect-video hover:!text-default"${addAttribute(url, "href")}>
  <figure class="relative w-full h-full overflow-hidden">
    <!-- <picture>
      <source type="image/avif" srcset={avifSrcset} {sizes} />
      <source type="image/webp" srcset={webpSrcset} {sizes} />
      <source type="image/png" srcset={pngSrcset} {sizes} />
      <img
        class="object-cover w-full h-full transition-all duration-300 bg-cover group-hover:scale-110 group-hover:opacity-20 group-focus:scale-110 group-focus:opacity-20"
        src={png[0].url}
        width={png[0].width}
        height={png[0].height}
        loading="lazy"
        decoding="async"
        onload="this.style.backgroundImage='none'"
        style={\`background-image: url(\${placeholder.dataURI});\`}
        alt={\`A screenshot of \${url}\`}
      />
    </picture> -->
    <figcaption class="absolute inset-0">
      <div class="flex flex-col items-center justify-center h-full gap-2 transition-all duration-300 opacity-0 group-hover:opacity-100 group-focus:opacity-100">
        <h3 class="text-xl font-extrabold text-center uppercase">
          ${title}
        </h3>
        <p class="px-4 py-2 border border-current">${url}</p>
      </div>
    </figcaption>
  </figure>
</a>`;
});

const $$file$4 = "/Volumes/Cache/repos/codos-dio/src/components/showcase-card.astro";
const $$url$4 = undefined;

const $$module2 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  $$metadata: $$metadata$4,
  default: $$ShowcaseCard,
  file: $$file$4,
  url: $$url$4
}, Symbol.toStringTag, { value: 'Module' }));

const sites = [
	{
		title: "PoliNations",
		image: "src/data/showcase/images/polinations.png",
		url: "https://polinations.com/"
	},
	{
		title: "Astro Docs",
		image: "src/data/showcase/images/astro-docs.png",
		url: "https://docs.astro.build/"
	},
	{
		title: "<div>RIOTS",
		image: "src/data/showcase/images/divriots.png",
		url: "https://divriots.com/"
	},
	{
		title: "Designcember",
		image: "src/data/showcase/images/designcember.png",
		url: "https://designcember.com/"
	},
	{
		title: "The Firebase Blog",
		image: "src/data/showcase/images/firebase-blog.png",
		url: "https://firebase.blog/"
	},
	{
		title: "Corset",
		image: "src/data/showcase/images/corset.png",
		url: "https://corset.dev/"
	}
];

const $$module3$1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: sites
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata$3 = createMetadata("/@fs/Volumes/Cache/repos/codos-dio/src/components/contact.astro", { modules: [{ module: $$module1$5, specifier: "~/components/content-section.astro", assert: {} }, { module: $$module2, specifier: "~/components/showcase-card.astro", assert: {} }, { module: $$module3$1, specifier: "~/data/showcase/sites.json", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$3 = createAstro("/@fs/Volumes/Cache/repos/codos-dio/src/components/contact.astro", "https://dio.codos.co.nz/", "file:///Volumes/Cache/repos/codos-dio/");
const $$Contact = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$3, $$props, $$slots);
  Astro2.self = $$Contact;
  return renderTemplate`${renderComponent($$result, "ContentSection", $$ContentSection, { "title": "Contact", "id": "contact" }, { "default": () => renderTemplate`${maybeRenderHead($$result)}<div class="max-w-6xl space-y-2">
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      ${sites.map(({ title, image, url }) => renderTemplate`${renderComponent($$result, "ShowcaseCard", $$ShowcaseCard, { "title": title, "image": image, "url": url })}`)}
    </div>
    <p class="text-sm text-right">
      <a class="text-primary" href="https://codos.co.nz">
        ...and more &rarr;
      </a>
    </p>
  </div>`, "lead": () => renderTemplate`${renderComponent($$result, "Fragment", Fragment, { "slot": "lead" }, { "default": () => renderTemplate`
    CODOS is <span class="text-primary">versatile</span>.${" "}<span class="text-primary">Explore</span> what's possible and get${" "}<span class="text-primary">inspired</span>.
  ` })}` })}`;
});

const $$file$3 = "/Volumes/Cache/repos/codos-dio/src/components/contact.astro";
const $$url$3 = undefined;

const $$module6 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  $$metadata: $$metadata$3,
  default: $$Contact,
  file: $$file$3,
  url: $$url$3
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata$2 = createMetadata("/@fs/Volumes/Cache/repos/codos-dio/src/components/starfield.astro", { modules: [], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [{ type: "inline", value: `
  const COUNT = 800;
  const SPEED = 0.1;

  class Star {
    x: number;
    y: number;
    z: number;
    xPrev: number;
    yPrev: number;

    constructor(x = 0, y = 0, z = 0) {
      this.x = x;
      this.y = y;
      this.z = z;
      this.xPrev = x;
      this.yPrev = y;
    }

    update(width: number, height: number, speed: number) {
      this.xPrev = this.x;
      this.yPrev = this.y;
      this.z += speed * 0.0675;
      this.x += this.x * (speed * 0.0225) * this.z;
      this.y += this.y * (speed * 0.0225) * this.z;
      if (
        this.x > width / 2 ||
        this.x < -width / 2 ||
        this.y > height / 2 ||
        this.y < -height / 2
      ) {
        this.x = Math.random() * width - width / 2;
        this.y = Math.random() * height - height / 2;
        this.xPrev = this.x;
        this.yPrev = this.y;
        this.z = 0;
      }
    }

    draw(ctx: CanvasRenderingContext2D) {
      ctx.lineWidth = this.z;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.xPrev, this.yPrev);
      ctx.stroke();
    }
  }

  const stars = Array.from({ length: COUNT }, () => new Star(0, 0, 0));
  let rafId = 0;

  const canvas: HTMLCanvasElement = document.querySelector("#starfield-canvas");
  const ctx = canvas.getContext("2d");

  const container = document.querySelector("#starfield");
  const resizeObserver = new ResizeObserver(setup);
  resizeObserver.observe(container);

  function setup() {
    rafId > 0 && cancelAnimationFrame(rafId);
    const { clientWidth: width, clientHeight: height } = container;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = \`\${width}px\`;
    canvas.style.height = \`\${height}px\`;
    ctx.scale(dpr, dpr);

    for (const star of stars) {
      star.x = Math.random() * width - width / 2;
      star.y = Math.random() * height - height / 2;
      star.z = 0;
    }

    ctx.translate(width / 2, height / 2);
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.strokeStyle = "white";
    rafId = requestAnimationFrame(frame);
  }

  function frame() {
    const { clientWidth: width, clientHeight: height } = container;

    for (const star of stars) {
      star.update(width, height, SPEED);
      star.draw(ctx);
    }

    ctx.fillRect(-width / 2, -height / 2, width, height);
    rafId = requestAnimationFrame(frame);
  }
` }] });
const $$Astro$2 = createAstro("/@fs/Volumes/Cache/repos/codos-dio/src/components/starfield.astro", "https://dio.codos.co.nz/", "file:///Volumes/Cache/repos/codos-dio/");
const $$Starfield = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$2, $$props, $$slots);
  Astro2.self = $$Starfield;
  return renderTemplate`${maybeRenderHead($$result)}<div id="starfield" class="absolute inset-0">
  <canvas id="starfield-canvas"></canvas>
</div>

`;
});

const $$file$2 = "/Volumes/Cache/repos/codos-dio/src/components/starfield.astro";
const $$url$2 = undefined;

const $$module3 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  $$metadata: $$metadata$2,
  default: $$Starfield,
  file: $$file$2,
  url: $$url$2
}, Symbol.toStringTag, { value: 'Module' }));

const Performer1 = {"src":"/assets/performer_1.ff216eaa.png","width":1358,"height":2048,"format":"png"};

const $$module5 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: Performer1
}, Symbol.toStringTag, { value: 'Module' }));

const $$metadata$1 = createMetadata("/@fs/Volumes/Cache/repos/codos-dio/src/components/splash.astro", { modules: [{ module: $$module1, specifier: "@astrojs/image/components", assert: {} }, { module: $$module2$5, specifier: "astro-icon", assert: {} }, { module: $$module3, specifier: "~/components/starfield.astro", assert: {} }, { module: $$module4$2, specifier: "~/components/hero-image.astro", assert: {} }, { module: $$module5, specifier: "~/assets/performer_1.png", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro$1 = createAstro("/@fs/Volumes/Cache/repos/codos-dio/src/components/splash.astro", "https://dio.codos.co.nz/", "file:///Volumes/Cache/repos/codos-dio/");
const $$Splash = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$Splash;
  const widths = [450, 640];
  const sizes = "(min-width: 640px) 42vw, 67vw";
  const STYLES = [];
  for (const STYLE of STYLES)
    $$result.styles.add(STYLE);
  return renderTemplate`${maybeRenderHead($$result)}<section class="relative h-full bg-black astro-ACL3IRZE">
  ${renderComponent($$result, "Starfield", $$Starfield, { "class": "astro-ACL3IRZE" })}
  <div id="splash-bg-fallback" class="absolute inset-0 hidden opacity-40 astro-ACL3IRZE">
    ${renderComponent($$result, "HeroImage", $$HeroImage, { "class": "astro-ACL3IRZE" })}
  </div>
  <div class="relative grid h-full sm:grid-cols-2 place-items-center astro-ACL3IRZE">
    <h1 class="flex flex-col self-end gap-2 sm:gap-4 sm:self-auto sm:justify-self-end astro-ACL3IRZE">
      <div class="font-extrabold tracking-tighter text-center text-9xl gradient-text astro-ACL3IRZE">
        DRAG.
        <br class="astro-ACL3IRZE"> IT.
        <br class="astro-ACL3IRZE"> OUT.
      </div>
    </h1>
    ${renderComponent($$result, "Picture", $$Picture, { "src": Performer1, "class": "self-start w-2/3 max-w-3xl sm:w-10/12 sm:self-auto sm:justify-self-start astro-ACL3IRZE", "widths": widths, "sizes": sizes, "formats": ["avif", "jpeg", "png", "webp"], "alt": "A drag performer appearing in the void" })}
  </div>
</section>

<noscript>
  <style>
    #splash-bg-fallback {
      display: block;
    }
  </style>
</noscript>

`;
});

const $$file$1 = "/Volumes/Cache/repos/codos-dio/src/components/splash.astro";
const $$url$1 = undefined;

const $$module7 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  $$metadata: $$metadata$1,
  default: $$Splash,
  file: $$file$1,
  url: $$url$1
}, Symbol.toStringTag, { value: 'Module' }));

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(raw || cooked.slice()) }));
var _a;
const $$metadata = createMetadata("/@fs/Volumes/Cache/repos/codos-dio/src/pages/index.astro", { modules: [{ module: $$module1$2, specifier: "~/components/aboutus.astro", assert: {} }, { module: $$module2$3, specifier: "~/components/events.astro", assert: {} }, { module: $$module3$2, specifier: "~/components/footer.astro", assert: {} }, { module: $$module4$1, specifier: "~/components/header.astro", assert: {} }, { module: $$module5$1, specifier: "~/components/intro.astro", assert: {} }, { module: $$module6, specifier: "~/components/contact.astro", assert: {} }, { module: $$module7, specifier: "~/components/splash.astro", assert: {} }], hydratedComponents: [], clientOnlyComponents: [], hydrationDirectives: /* @__PURE__ */ new Set([]), hoisted: [] });
const $$Astro = createAstro("/@fs/Volumes/Cache/repos/codos-dio/src/pages/index.astro", "https://dio.codos.co.nz/", "file:///Volumes/Cache/repos/codos-dio/");
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  const { site } = Astro2;
  const image = new URL("social.jpg", site);
  const description = "CODOS offers a new kind of site builder for the modern web. Lightning-fast performance meets amazing end-user experience.";
  return renderTemplate(_a || (_a = __template(['<html lang="en" class="h-full motion-safe:scroll-smooth" data-theme="dark">\n  <head>\n    <meta charset="utf-8">\n    <meta name="viewport" content="width=device-width">\n    <link rel="icon" href="/favicon.ico" sizes="any">\n    <link rel="icon" href="/favicon.svg" type="image/svg+xml">\n\n    <title>DRAG IT OUT</title>\n    <meta name="description"', `>

    <!-- fonts -->
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;800&display=swap">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;800&display=swap" media="print" onload="this.media='all'">
    `, '<noscript>\n      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;800&display=swap">\n    </noscript>\n\n    <!-- social media -->\n    <meta property="og:title" content="Drag It Out">\n    <meta property="og:type" content="website">\n    <meta property="og:description"', '>\n    <meta property="og:image"', '>\n    <meta property="og:url"', '>\n    <meta name="twitter:card" content="summary_large_image">\n\n    <!-- initialize theme -->\n    <script>\n      const themeSaved = localStorage.getItem("theme");\n\n      if (themeSaved) {\n        document.documentElement.dataset.theme = themeSaved;\n      } else {\n        const prefersDark = window.matchMedia(\n          "(prefers-color-scheme: dark)"\n        ).matches;\n        document.documentElement.dataset.theme = prefersDark ? "dark" : "light";\n      }\n\n      window\n        .matchMedia("(prefers-color-scheme: dark)")\n        .addEventListener("change", (event) => {\n          if (!localStorage.getItem("theme")) {\n            document.documentElement.dataset.theme = event.matches\n              ? "dark"\n              : "light";\n          }\n        });\n    <\/script>\n  ', '</head>\n  <body class="h-full overflow-x-hidden text-base bg-default text-default selection:bg-secondary selection:text-white">\n    ', "\n    ", '\n    <div class="px-8 py-32 space-y-24">\n      ', "\n      ", "\n      ", "\n      ", "\n    </div>\n    ", "\n  </body></html>"])), addAttribute(description, "content"), maybeRenderHead($$result), addAttribute(description, "content"), addAttribute(image, "content"), addAttribute(site, "content"), renderHead($$result), renderComponent($$result, "Header", $$Header, {}), renderComponent($$result, "Splash", $$Splash, {}), renderComponent($$result, "Intro", $$Intro, {}), renderComponent($$result, "Events", $$Events, {}), renderComponent($$result, "AboutUs", $$Aboutus, {}), renderComponent($$result, "Contact", $$Contact, {}), renderComponent($$result, "Footer", $$Footer, {}));
});

const $$file = "/Volumes/Cache/repos/codos-dio/src/pages/index.astro";
const $$url = "";

const _page1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  $$metadata,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const pageMap = new Map([['node_modules/.pnpm/@astrojs+image@0.7.0/node_modules/@astrojs/image/dist/endpoint.js', _page0],['src/pages/index.astro', _page1],]);
const renderers = [Object.assign({"name":"astro:jsx","serverEntrypoint":"astro/jsx/server.js","jsxImportSource":"astro"}, { ssr: server_default }),];

if (typeof process !== "undefined") {
  if (process.argv.includes("--verbose")) ; else if (process.argv.includes("--silent")) ; else ;
}

const SCRIPT_EXTENSIONS = /* @__PURE__ */ new Set([".js", ".ts"]);
new RegExp(
  `\\.(${Array.from(SCRIPT_EXTENSIONS).map((s) => s.slice(1)).join("|")})($|\\?)`
);

const STYLE_EXTENSIONS = /* @__PURE__ */ new Set([
  ".css",
  ".pcss",
  ".postcss",
  ".scss",
  ".sass",
  ".styl",
  ".stylus",
  ".less"
]);
new RegExp(
  `\\.(${Array.from(STYLE_EXTENSIONS).map((s) => s.slice(1)).join("|")})($|\\?)`
);

function getRouteGenerator(segments, addTrailingSlash) {
  const template = segments.map((segment) => {
    return segment[0].spread ? `/:${segment[0].content.slice(3)}(.*)?` : "/" + segment.map((part) => {
      if (part)
        return part.dynamic ? `:${part.content}` : part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }).join("");
  }).join("");
  let trailing = "";
  if (addTrailingSlash === "always" && segments.length) {
    trailing = "/";
  }
  const toPath = compile(template + trailing);
  return toPath;
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  return {
    ...serializedManifest,
    assets,
    routes
  };
}

const _manifest = Object.assign(deserializeManifest({"adapterName":"@astrojs/netlify/functions","routes":[{"file":"","links":[],"scripts":[],"routeData":{"type":"endpoint","route":"/_image","pattern":"^\\/_image$","segments":[[{"content":"_image","dynamic":false,"spread":false}]],"params":[],"component":"node_modules/.pnpm/@astrojs+image@0.7.0/node_modules/@astrojs/image/dist/endpoint.js","pathname":"/_image","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":["assets/index.1a9973df.css"],"scripts":[{"type":"external","value":"hoisted.b2d89190.js"}],"routeData":{"route":"/","type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","_meta":{"trailingSlash":"ignore"}}}],"site":"https://dio.codos.co.nz/","base":"/","markdown":{"drafts":false,"syntaxHighlight":"shiki","shikiConfig":{"langs":[],"theme":"github-dark","wrap":false},"remarkPlugins":[],"rehypePlugins":[],"remarkRehype":{},"extendDefaultPlugins":false,"isAstroFlavoredMd":false},"pageMap":null,"renderers":[],"entryModules":{"\u0000@astrojs-ssr-virtual-entry":"entry.mjs","/astro/hoisted.js?q=0":"hoisted.b2d89190.js","astro:scripts/before-hydration.js":""},"assets":["/assets/wordmark.3659e8e0.webp","/assets/hero.9b0767a5.webp","/assets/performer_1.ff216eaa.png","/assets/index.1a9973df.css","/favicon.ico","/favicon.svg","/hoisted.b2d89190.js","/social.jpg"]}), {
	pageMap: pageMap,
	renderers: renderers
});
const _args = {};

const _exports = adapter.createExports(_manifest, _args);
const handler = _exports['handler'];

const _start = 'start';
if(_start in adapter) {
	adapter[_start](_manifest, _args);
}

export { handler };
