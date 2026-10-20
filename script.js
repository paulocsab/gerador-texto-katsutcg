
(
    ()=>{'use strict';
    const KEY='gerador-texto-katsutcg-v1';
    const $=id=>document.getElementById(id);
    const fields=['carta','idioma','condicao','referencia','pagamento'];
    let entries=[];
    let editing=null;
    
    try {
        const saved=JSON.parse(localStorage.getItem(KEY)||'[]');
        if(Array.isArray(saved))entries=saved.filter(e=>e&&typeof e==='object')
        } catch {}

    const formatDate=d=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(d||''))return '';
    const [y,m,day]=d.split('-');return `${day}/${m}`};
    const message=e=>`🎴 Carta: ${e.carta||''}
🗣️ Idioma: ${e.idioma||''}
🧑🏻‍⚕️ Condição: ${e.condicao||''}
💸 Referência: ${e.referencia||''}
🗓️ Pagamento até: ${formatDate(e.pagamento)}
Pix ou Crédito 12x (mais juros da máquina)`;
    const values=()=>Object.fromEntries(fields.map(k=>[k,$(k).value.trim()]));
    const persist=()=>{
        try{
            localStorage.setItem(KEY,JSON.stringify(entries))
        } catch {
            $('status').textContent='Não foi possível salvar automaticamente neste navegador.'
        }
    };
    const allText=()=>entries.map(message).join('\n\n--------------------\n\n');
    const paymentPicker=flatpickr($('pagamento'),{dateFormat:'Y-m-d',altInput:true,altFormat:'d/m',allowInput:false,locale:'pt',onChange:()=>preview()});
    
    
    function preview() { 
        $('preview').textContent=message(values())
    }
    
    function reset() {
        editing=null;
        $('cardForm').reset();paymentPicker.clear();
        $('idioma').value='PT-BR';
        $('formTitle').textContent='Nova carta';
        $('submitBtn').textContent='Adicionar carta';
        $('cancelBtn').hidden=true;preview()
    }
    
    function render() {
        $('count').textContent=entries.length;
        const root=$('entries');root.replaceChildren();
        if (!entries.length) {
            const e=document.createElement('div');
            e.className='empty';
            e.textContent='Nenhuma carta adicionada ainda.';
            root.append(e)}entries.forEach((e,i)=>{const box=document.createElement('article');box.className='entry';const head=document.createElement('div');head.className='entryhead';const title=document.createElement('strong');title.textContent=`${i+1}. ${e.carta}`;const actions=document.createElement('div');actions.className='actions';const edit=document.createElement('button');edit.textContent='Editar';edit.onclick=()=>{editing=e.id;fields.forEach(k=>$(k).value=e[k]||'');paymentPicker.setDate(e.pagamento||'',false);$('formTitle').textContent='Editar carta';$('submitBtn').textContent='Salvar alterações';$('cancelBtn').hidden=false;preview();window.scrollTo({top:0,behavior:'smooth'});$('carta').focus()};const del=document.createElement('button');del.className='danger';del.textContent='Excluir';del.onclick=()=>{if(!confirm(`Excluir a mensagem de ${e.carta}?`))return;entries=entries.filter(x=>x.id!==e.id);if(editing===e.id)reset();persist();render()};actions.append(edit,del);head.append(title,actions);const body=document.createElement('pre');body.textContent=message(e);box.append(head,body);root.append(box)});$('exportBtn').disabled=$('copyBtn').disabled=$('clearBtn').disabled=!entries.length}
$('cardForm').addEventListener('input',preview);$('cardForm').addEventListener('change',preview);$('cardForm').addEventListener('submit',ev=>{ev.preventDefault();const data=values();if(!data.carta||!data.condicao||!data.referencia||!data.pagamento)return;if(editing!==null){entries=entries.map(e=>e.id===editing?{...e,...data}:e)}else{entries.push({...data,id:globalThis.crypto?.randomUUID?.()||String(Date.now())+'-'+Math.random()})}persist();reset();render()});$('cancelBtn').onclick=reset;
$('exportBtn').onclick=()=>{const blob=new Blob(['\ufeff',allText()],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='mensagens-cartas.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)};
$('copyBtn').onclick=async()=>{try{await navigator.clipboard.writeText(allText());$('status').textContent='Mensagens copiadas!'}catch{$('status').textContent='Não foi possível copiar automaticamente. Use o arquivo .txt.'}};
$('clearBtn').onclick=()=>{if(!confirm('Excluir todas as mensagens?'))return;entries=[];persist();reset();render()};reset();render();
})();