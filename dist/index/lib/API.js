export { generatePain, generatePainObject, toJson }

function generatePain(indentation = 2) {
  return toJson(generatePainObject(), indentation)
}

function generatePainObject() {
  return generateObject(4)
}

function toJson(object, indentation = 2){
  return JSON.stringify(object, undefined, " ".repeat(indentation))
}

function generateObject(remainingDepth, propertyName) {
  const shouldContainEntriesProbability = 0.4 * remainingDepth;
  if (Math.random() < shouldContainEntriesProbability) {
    const object = {};

    const entryCount = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < entryCount; i++) {
      let propertyName = generateWord();
      object[propertyName] = generateObject(remainingDepth / 2, propertyName);
    }
    if (remainingDepth < 4 && Math.random() < 0.03) return JSON.stringify(object);
    else return object;
  } 
  else return generatePrimitiveValue(propertyName);
}

function generateWord() {
  if (Math.random() < 0.05) {
    const crypticChars = "atrsxcznqwxxxzztt1234567890__---$$"
    return select(crypticChars) + select(crypticChars) + select(crypticChars);
  }

  let main = select(mainWords);
  if (Math.random() < 0.6) main = select(prefixes) + capitalize(main);
  if (Math.random() < 0.2) main = select(prefixes) + capitalize(main);
  if (Math.random() < 0.4) main = main + capitalize(select(suffixes));
  if (Math.random() < 0.3) main = main + capitalize(select(suffixes));
  if (Math.random() < 0.1) main = main + capitalize(select(suffixes));
  if (Math.random() < 0.1) main = main + capitalize(select(suffixes));
  if (Math.random() < 0.1) main = main + capitalize(select(suffixes));
  if (Math.random() < 0.1) main = main + capitalize(select(suffixes));
  if (Math.random() < 0.06) main = toScreamCase(main);
  return main;
}

function generatePrimitiveValue(name) {
  if (name && name.startsWith("is")) return select(booleans);
  if (name && name.endsWith("Id"))
    return { id: Math.floor(Math.random() * 867473).toString() };

  if (Math.random() < 0.25) return '[$' + generateWord() + ']';

  if (Math.random() < 0.05) return generateInjectableSQL();
  if (Math.random() < 0.08) return Math.floor(Math.random() * 2057473);
  if (Math.random() < 0.08)
    return Math.floor(Math.random() * 867473).toString();
  if (Math.random() < 0.04) 
    return generateWord() + "[" + generateWord() + "]";
  if (Math.random() < 0.07)
    return (
      toScreamCase("" + select(values)) +
      "[" +
      Math.floor(Math.random() * 3456).toString() +
      "]"
    );
  else return select(values);
}

function generateInjectableSQL() {
  const prop = generateWord();
  return `SELECT * FROM ${generateWord()}Table WHERE ${prop}=${"" + generatePrimitiveValue(prop)
    } OR 1=1`;
}

function select(candidates) {
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function capitalize(string) {
  if (string === "") return "";
  else return string.charAt(0).toUpperCase() + string.slice(1);
}

function toScreamCase(camelCase) {
  return toSnakeCase(camelCase).toUpperCase();
}

function toSnakeCase(camelCase) {
  return camelCase.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

const mainWords = [
  "alignment",
  "amount",
  "api",
  "column",
  "content",
  "data",
  "endpoint",
  "entry",
  "error",
  "header",
  "kind",
  "num",
  "object",
  "redirection",
  "row",
  "string",
  "strings",
  "system",
  "table",
  "type",
  "val",
  "value",
];

const prefixes = [
  "__private_",
  "_",
  "backend",
  "boat",
  "data",
  "deleted",
  "deny",
  "deprecated",
  "deprecation",
  "external",
  "fix",
  "forward",
  "frontend",
  "injected",
  "internal",
  "is",
  "legacy",
  "m_",
  "main",
  "mapped",
  "previous",
  "primary",
  "request",
  "responding",
  "response",
  "reverse",
  "secondary",
  "sys_".toUpperCase(),
  "the",
  "unique",
  "unknown",
  "unsupported",
  "update",
  "validated",
  "validation",
  "value",
];

const suffixes = [
  "_",
  "_0",
  "_3",
  "_t",
  "1",
  "2",
  "accessor",
  "age",
  "api",
  "attribiut",
  "attribiutes",
  "authentication",
  "buffer",
  "bug",
  "checker",
  "condition",
  "connector",
  "constructor",
  "contact",
  "content",
  "context",
  "copy",
  "correction",
  "counter",
  "creator",
  "CS",
  "ctx",
  "data",
  "date",
  "dictionary",
  "DOS",
  "dto",
  "duration",
  "exception",
  "expression",
  "factory",
  "feature",
  "fetcher",
  "field",
  "hash",
  "helper",
  "html",
  "id",
  "implementation",
  "index",
  "inheritance",
  "interface",
  "interpolator",
  "invoker",
  "issue",
  "json",
  "limit",
  "location",
  "lookup",
  "mapper",
  "name",
  "object",
  "observer",
  "order",
  "origin",
  "password",
  "pipe",
  "pointer",
  "position",
  "property",
  "protection",
  "provider",
  "query",
  "referee",
  "reference",
  "secret",
  "size",
  "source",
  "strategy",
  "structure",
  "syntax",
  "text",
  "time",
  "TXN",
  "type",
  "validator",
  "value",
  "waypoint",
  "where",
];

const values = [
  -2,
  -5,
  'java.lang.InvalidOperationException in thread "main" at database/DataBaseCore.java:18 ...',
  'java.lang.NullPointerException in thread "main" at database/DataBaseCore.java:15 ...',
  'java.lang.OutOfBoundsException in thread "main" at database/DataBaseCore.java:6 ...',
  "../",
  "../next/invoker",
  ".",
  "./error.json",
  "'function(){ return <?php echo 'logging in as ' . encrypt($user->password); ?> }'",
  "'function(){ return undefined; }'",
  "'function(){ window.href=`${base_url}.php` }'",
  "",
  "/",
  "/index.html",
  "/index",
  "<?php {$php} ?>",
  "<?php `${code}` ?>",
  "<?php `${php}` ?>",
  "<?php `${user}` ?>",
  "<?php user->pw ?>",
  "<div id='content-header'>",
  "06/3/12",
  "12/08/29",
  "2/11/08",
  "3/05/11",
  "all",
  "api",
  "column",
  "external",
  "first",
  "five",
  "internal",
  "java.lang.InvalidArgumentsException",
  "java.lang.InvalidOperationException",
  "java.lang.NullPointerException",
  "java.lang.OutOfBoundsException",
  "last",
  "left",
  "legacy",
  "name",
  "next",
  "no",
  "none",
  "nothing",
  "null",
  "pi",
  "plumbus",
  "primary",
  "right",
  "row",
  "secondary",
  "some",
  "string",
  "two",
  "undefined",
  "yes",
  "zero",
  0,
  1,
  false,
  null,
  true,
  undefined,
];

const booleans = [
  "",
  "no",
  "none",
  "nothing",
  "null",
  "onlyWhenExternal",
  "string",
  "undefined",
  "whenInternal",
  "yes",
  "zero",
  0,
  1,
  false,
  null,
  true,
  undefined,
];
