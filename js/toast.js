(function injectToastContainer() {
    if(document.getElementById("scente-toast"))return;
    const toast=document.createElement("div");
    toast.id="scente-toast";
    Object.assign(toast.style,  {
        position:"fixed", bottom:"32px", left:"50%", transform:"translateX(-50%) translateY(12px)", zIndex:"9999", padding:"13px 32px", fontFamily:"var(--font-body, 'Jost', sans-serif)", fontSize:"12px", fontWeight:"500", letterSpacing:"0.1em", textTransform:"uppercase", color:"#ffffff", background:"#1a1a1a", opacity:"0", pointerEvents:"none", transition:"opacity 0.25s ease, transform 0.25s ease", whiteSpace:"nowrap", borderRadius:"0"
    });
    document.body.appendChild(toast)
})();
let _toastTimer=null;
function showToast(message, type="success", duration=2800) {
    const toast=document.getElementById("scente-toast");
    if(!toast)return;
    const colours= {
        success:"#1a1a1a", error:"#c0392b", info:"#d4808a"
    };
    toast.style.background=colours[type]||colours.success;
    toast.textContent=message;
    toast.style.opacity="1";
    toast.style.transform="translateX(-50%) translateY(0)";
    if(_toastTimer)clearTimeout(_toastTimer);
    _toastTimer=setTimeout(()=> {
        toast.style.opacity="0";
        toast.style.transform="translateX(-50%) translateY(12px)"
    }, duration)
}