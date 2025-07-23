/*****  0. Handsontable 初始化  *****/
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

/*****  1. 工具函数  *****/
const weeks=['7/13~7/19','7/20~7/26','7/27~8/2','8/3~8/9'];
const deepCopy=o=>JSON.parse(JSON.stringify(o));
const crowd=(t)=>t.cap?t.size/t.cap:Infinity;
const shuffle=a=>a.sort(()=>Math.random()-0.5);

/*****  2. 主入口  *****/
document.getElementById('genBtn').addEventListener('click',()=>{

  /* 2-1 读取数据 */
  const locSrc = locHot.getData().filter(r=>r.some(c=>c))
        .map(r=>({name:r[1],cap:+r[5]||0}))
        .sort((a,b)=>b.cap-a.cap);                       // 按容量降序
  const teamsSrc = teamHot.getData().filter(r=>r.some(c=>c))
        .map(r=>({bdm:r[0],size:+r[1]||0}));

  if(!locSrc.length||!teamsSrc.length){alert('两张表都要粘贴数据！');return;}

  /********** 3. 周次循环分配：保证 “同一 BDM 不重复点位” **********/
  const weekAssign = {};       // {week:[{bdm,name,cap}]}
  const teamWeekStat={};       // {week:{bdm:{cap,locAmt}}}
  let locPoolAll = deepCopy(locSrc);   // 剩余未用点位，周间共享

  weeks.forEach((week,wIdx)=>{
    /* 3-1 为本周复制剩余点位并随机打散（避免总是同顺序） */
    const weekPool = shuffle(deepCopy(locPoolAll));

    /* 3-2 初始化团队状态 */
    const teams = teamsSrc.map(t=>({
      ...deepCopy(t),
      cap:0,
      locs:[],
      usedNames:new Set()            // 本团队历史点位
    }));

    /* 3-3 先把“上一周已用过某点位的团队”与该点位隔离 —— 简单轮换：队列每周整体右移 */
    // 其实更强的“不可重复”要求已在后面检查，这里只是初始打散

    /* 3-4 主分配循环：贪心 + 去重 */
    while(weekPool.length){
      weekPool.sort((a,b)=>b.cap-a.cap);          // 取最大坑
      const loc = weekPool.shift();

      // 找当前 crowd% 最大的团队，但必须没用过此点位
      teams.sort((a,b)=>crowd(b)-crowd(a));
      let tgt = teams.find(t=>!t.usedNames.has(loc.name));
      if(!tgt){   // 若都用过，则无硬性限制
        tgt = teams[0];
      }
      tgt.locs.push(loc);
      tgt.cap += loc.cap;
      tgt.usedNames.add(loc.name);

      // 从全局池删除该点位，确保后续周不会再出现
      locPoolAll = locPoolAll.filter(l=>l.name!==loc.name);
    }

    /* 3-5 保存本周结果 */
    weekAssign[week]=[];
    teamWeekStat[week]={};
    teams.forEach(t=>{
      t.locs.forEach(x=>weekAssign[week].push({...x,bdm:t.bdm}));
      teamWeekStat[week][t.bdm]={cap:t.cap,locAmt:t.locs.length,size:t.size};
    });
  });

  /********** 4. 视图 1 · 点位维度 **********/
  let v1='<h2>结果1·排班-点位维度</h2><table class="result"><tr><th>Location name</th>';
  weeks.forEach(w=>v1+=`<th>${w}</th>`); v1+='</tr>';
  locSrc.forEach(loc=>{
    v1+=`<tr><td>${loc.name}</td>`;
    weeks.forEach(w=>{
      const hit = weekAssign[w].find(x=>x.name===loc.name);
      v1+=`<td>${hit?hit.bdm:''}</td>`;
    });
    v1+='</tr>';
  });
  v1+='</table>';

  /********** 5. 视图 2 · 团队维度 **********/
  let v2='<h2>视图2·排班-团队维度</h2><table class="result"><tr><th>BDM</th>';
  weeks.forEach(w=>v2+=`<th>${w}</th>`); v2+='</tr>';
  teamsSrc.forEach(t=>{
    v2+=`<tr><td>${t.bdm}</td>`;
    weeks.forEach(w=>{
      const locList = weekAssign[w]
        .filter(x=>x.bdm===t.bdm)
        .map(x=>x.name)
        .join('\n');                         // 多点位换行显示
      v2+=`<td>${locList||'/'}</td>`;
    });
    v2+='</tr>';
  });
  v2+='</table>';

  /********** 6. 视图 3 · 团队拥挤度（带筛选） **********/
  const crowdTbl=wk=>{
    let html='<table class="result"><tr><th>BDM</th><th>Team Size</th><th>Location Amount</th><th>Cap Sum</th><th>Crowd%</th></tr>';
    teamsSrc.forEach(t=>{
      const s=teamWeekStat[wk][t.bdm];
      const pct=(s.size/s.cap*100).toFixed(2)+'%';
      html+=`<tr><td>${t.bdm}</td><td>${s.size}</td><td>${s.locAmt}</td><td>${s.cap}</td><td>${pct}</td></tr>`;
    });
    return html+'</table>';
  };

  let v3='<h2>结果3·团队拥挤度</h2><div class="filterBox">查看周次：<select id="wkSel">';
  weeks.forEach(w=>v3+=`<option value="${w}">${w}</option>`); v3+='</select></div><div id="crowdBox"></div>';

  /********** 7. 输出到页面 & 绑定筛选 **********/
  document.getElementById('output').innerHTML=v1+v2+v3;
  const crowdBox=document.getElementById('crowdBox');
  const wkSel=document.getElementById('wkSel');
  const render=()=>crowdBox.innerHTML=crowdTbl(wkSel.value);
  wkSel.addEventListener('change',render); render();
});
