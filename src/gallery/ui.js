function main({ canvas }) {
  // ...
  const task = mainAsync({ canvas, assets: {} })
}

async function mainAsync(options){
    //try {
        await startAR(options)
    //}
    //catch(error){
    //    document.body.innerHTML = error.toString()
    //}
}

function resolveArtLocation(url) {
  const urlObj = new URL(url);
  const hash = urlObj.hash;
  if (!hash) {
    return null;
  }
  const hashParams = hash.slice(1).split('&');
  let params = { r: null, b: null };
  hashParams.forEach(param => {
    let [key, value] = param.split('=');

    if (key === 'r' || key === 'b') {
      params[key] = decodeURIComponent(value);
    }
  });
  return params;
}

function getURL() {
  return window.location.href;
}

function getArtLocation() {
  return resolveArtLocation(getURL());
}
