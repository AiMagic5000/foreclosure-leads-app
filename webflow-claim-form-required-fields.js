/**
 * Webflow Claim Form - Required Fields Fix
 *
 * Paste this into: Webflow Designer > Page Settings > Custom Code > Before </body> tag
 * Page: /claim-foreclosure-surplus-funds
 *
 * Adds validation for: City, Zip Code, County, Approximate Foreclosure Date
 * Adds asterisk indicators to match existing required field styling
 */
(function(){
  var poll=setInterval(function(){
    if(typeof usfrValidate!=='function')return;
    clearInterval(poll);

    var $=document.getElementById.bind(document);

    /* ── 1. Add asterisks to newly-required labels ────────── */
    ['usfr-city','usfr-zip','usfr-county','usfr-fcdate'].forEach(function(id){
      var el=$(id);
      if(!el)return;
      var label=el.previousElementSibling;
      if(!label)return;
      /* walk up if wrapped in a div */
      if(label.tagName!=='LABEL'){
        var parent=el.parentElement;
        if(parent) label=parent.querySelector('label');
      }
      if(label && label.tagName==='LABEL' && !label.querySelector('.usfr-req')){
        var span=document.createElement('span');
        span.className='usfr-req';
        span.textContent=' *';
        label.appendChild(span);
      }
    });

    /* ── 2. Create error divs for new required fields ─────── */
    var errMsgs={
      'city':'City is required',
      'zip':'Zip code is required',
      'county':'County is required',
      'fcdate':'Foreclosure date is required'
    };
    Object.keys(errMsgs).forEach(function(key){
      var errId='usfr-e-'+key;
      if($(errId))return;
      var input=$('usfr-'+key);
      if(!input)return;
      var div=document.createElement('div');
      div.id=errId;
      div.className='usfr-ferr';
      div.style.display='none';
      div.style.color='#dc2626';
      div.style.fontSize='12px';
      div.style.marginTop='4px';
      div.textContent=errMsgs[key];
      input.parentNode.insertBefore(div,input.nextSibling);
    });

    /* ── 3. Override validation to enforce new fields ──────── */
    window.usfrValidate=function(s){
      usfrClearErrs();
      var ok=true;
      if(s===1){
        if(!usfrVal('usfr-name'))ok=false;
        if(!usfrVal('usfr-email')||!$('usfr-email').value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)){usfrShowFErr('usfr-email');ok=false;}
        if(!usfrVal('usfr-phone')||$('usfr-phone').value.replace(/\D/g,'').length<7){usfrShowFErr('usfr-phone');ok=false;}
      }
      if(s===2){
        if(!usfrVal('usfr-addr'))ok=false;
        if(!$('usfr-state').value){usfrShowFErr('usfr-state');ok=false;}
        if(!usfrVal('usfr-city'))ok=false;
        if(!usfrVal('usfr-zip'))ok=false;
        if(!usfrVal('usfr-county'))ok=false;
        if(!usfrVal('usfr-fcdate'))ok=false;
      }
      return ok;
    };

  },100);
})();
