/***** 0 · Handsontable 初始化 *****/
const locHot = new Handsontable(document.getElementById('locTable'),{
  data:[Array(6).fill('')],
  colHeaders:['Station','Location name','Sun-Wed BD','Thu-Sat BD','Security','Max BD'],
  rowHeaders:true,stretchH:'all',minSpareRows:5,
  licenseKey:'non-commercial-and-evaluation'
});
const teamHot = new Handsontable(document.getElementById('teamTable'),{
  data:[Array(2).fill('')],
  colHeaders:['BDM','Team Size'],
  rowHeaders:true,stretchH:'all',minSpareRows:5,
  licenseKey:'non-commercial-and-evaluation'
});

/***** 1 · 常用工具 *****/
const weeks=['7/13~7/19','7/20~7/26','7/27~8/2','8/3~8/9'];
const copy=o=>JSON.parse(JSON.stringify(o));
const shuffle=a=>a.sort(()=>Math.random()-0.5);
const crowd=(t)=>t.cap?t.size/t.cap:Infinity;

/***** 2 · 主按钮 *****/
document.getElementById('genBtn').addEventListener('click',()=>{

  /* 2-1 读取 & 预处理 */
  const locSrc = locHot.getData().filter(r=>r.some(c=>c))
        .map(r=>({name:r[1],cap:+r[5]||0}))
        .sort((a,b)=>b.cap-a.cap);                 // 容量降序
  const teamSrc= teamHot.getData().filter(r=>r.some(c=>c))
        .map(r=>({bdm:r[0],size:+r[1]||0}));

  if(!locSrc.length||!teamSrc.length){alert('两张表都要粘贴数据！');return;}

  /***** 3 · 排班算法 *****/
  const weekAssign={}, weekStats={};                    // 结果容器
  const usedMap={};                                    // {bdm:Set(loc)} 记录历史点位
  teamSrc.forEach(t=>usedMap[t.bdm]=new Set());

  let globalPool=copy(locSrc);                         // 剩余点位

  weeks.forEach(week=>{
    const teams=teamSrc.map(t=>({bdm:t.bdm,size:t.size,cap:0,locs:[]}));
    let pool=shuffle(copy(globalPool));                // 本周可用池

    /* —— 3-1 首轮：严格禁止重复 —— */
    pool.forEach(loc=>{
      teams.sort((a,b)=>crowd(b)-crowd(a));
      const targ=teams.find(t=>!usedMap[t.bdm].has(loc.name))||teams[0];
      targ.locs.push(loc); targ.cap+=loc.cap; usedMap[targ.bdm].add(loc.name);
    });

    /* —— 3-2 校正 crowd%，若任何团队 >120%，允许 1 个重复重新分配 —— */
    teams.forEach(t=>{
      if(t.size/t.cap>1.2){                            // 需要再补容量
        // 找还剩余的最大点位（可能重复）
        const more = globalPool.find(l=>!t.locs.includes(l));
        if(more){ t.locs.push(more); t.cap+=more.cap; }
      }
    });

    /* —— 3-3 保存周结果 & 更新全局池 —— */
    weekAssign[week]=[];
    weekStats[week]={};
    teams.forEach(t=>{
      t.locs.forEach(x=>weekAssign[week].push({...x,bdm:t.bdm}));
      weekStats[week][t.bdm]={size:t.size,locAmt:t.locs.length,cap:t.cap};
    });
    // 周结束后从 globalPool 删除已分配点位
    globalPool=globalPool.filter(l=>!weekAssign[week].some(a=>a.name===l.name));
  });

  /***** 4 · 视图 1 —— 点位维度 *****/
  let v1='<h2>结果1·排班-点位维度</h2><table class="result"><tr><th>Location name</th>';
  weeks.forEach(w=>v1+=`<th>${w}</th>`); v1+='</tr>';
  locSrc.forEach(loc=>{
    v1+=`<tr><td>${loc.name}</td>`;
    weeks.forEach(w=>{
      const hit=weekAssign[w].find(x=>x.name===loc.name);
      v1+=`<td>${hit?hit.bdm:''}</td>`;
    });
    v1+='</tr>';
  }); v1+='</table>';

  /***** 5 · 视图 2 —— 团队维度 *****/
  let v2='<h2>视图2·排班-团队维度</h2><table class="result"><tr><th>BDM</th>';
  weeks.forEach(w=>v2+=`<th>${w}</th>`); v2+='</tr>';
  teamSrc.forEach(t=>{
    v2+=`<tr><td>${t.bdm}</td>`;
    weeks.forEach(w=>{
      const list=weekAssign[w].filter(l=>l.bdm===t.bdm).map(l=>l.name).join('\n')||'/';
      v2+=`<td>${list}</td>`;
    });
    v2+='</tr>';
  }); v2+='</table>';

  /***** 6 · 视图 3 —— 拥挤度 + 筛选 *****/
  const makeTable=wk=>{
    let html='<table class="result"><tr><th>BDM</th><th>Team Size</th><th>Location Amount</th><th>Cap Sum</th><th>Crowd%</th></tr>';
    teamSrc.forEach(t=>{
      const s=weekStats[wk][t.bdm];
      const pct=(s.size/s.cap*100).toFixed(2)+'%';
      html+=`<tr><td>${t.bdm}</td><td>${s.size}</td><td>${s.locAmt}</td><td>${s.cap}</td><td>${pct}</td></tr>`;
    }); return html+'</table>';
  };
  let v3='<h2>结果3·团队拥挤度</h2><div class="filterBox">查看周次：<select id="wkSel">';
  weeks.forEach(w=>v3+=`<option value="${w}">${w}</option>`); v3+='</select></div><div id="crowdBox"></div>';

  /***** 7 · 渲染 & 交互 *****/
  document.getElementById('output').innerHTML=v1+v2+v3;
  const crowdBox=document.getElementById('crowdBox');
  const wkSel=document.getElementById('wkSel');
  const render=()=>crowdBox.innerHTML=makeTable(wkSel.value);
  wkSel.addEventListener('change',render); render();
});
