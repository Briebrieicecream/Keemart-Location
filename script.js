/* ============ 初始化两张表 ============ */

// Location 表 —— 6 列固定标题，不限行数
const locHot = new Handsontable(document.getElementById('locTable'),{
  data: [Array(6).fill('')],                        // 起始 1 空行
  colHeaders:[
    'Station',
    'Location Code',
    'Sun-Wed BD',
    'Thu-Sat BD',
    'Security Index',
    'Max BD'
  ],
  rowHeaders:true,
  minSpareRows:5,                                   // 始终保留 5 行空白，可无限扩行
  stretchH:'all',
  licenseKey:'non-commercial-and-evaluation'
});

// Team 表 —— 2 列标题
const teamHot = new Handsontable(document.getElementById('teamTable'),{
  data:[Array(2).fill('')],
  colHeaders:['BDM','Team Size'],
  rowHeaders:true,
  minSpareRows:5,
  stretchH:'all',
  licenseKey:'non-commercial-and-evaluation'
});

/* ============ 生成排班示范逻辑 ============ */

document.getElementById('genBtn').addEventListener('click',()=>{
  // 1) 读取并过滤空行
  const loc = locHot.getData()
               .filter(r=>r.some(c=>c!==null && c!==''));
  const team= teamHot.getData()
               .filter(r=>r.some(c=>c!==null && c!==''));

  if(!loc.length||!team.length){
    alert('请先分别粘贴 Location 与 Team 数据！');
    return;
  }

  // 2) 组装团队对象
  const teams = team.map(r=>({
    bdm:  r[0],
    size: Number(r[1])||0,
    assigned:[],
    cap:0
  }));

  // 3) 简单轮流分配点位到 BDM
  const weeks=['Week1','Week2','Week3','Week4'];
  loc.forEach((row,i)=>{
    const tgt=teams[i%teams.length];
    tgt.assigned.push({week:weeks[i%weeks.length],loc:row[1]});
    tgt.cap += Number(row[5])||0;
  });

  // 4) 输出结果表
  let html='<h2>Schedule Result</h2><table class=\"result\"><tr><th>BDM</th>';
  weeks.forEach(w=>html+=`<th>${w}</th>`);
  html+='<th>Team Size</th><th>Total Max BD</th><th>Crowd%</th></tr>';

  teams.forEach(t=>{
    html+=`<tr><td>${t.bdm}</td>`;
    weeks.forEach(w=>{
      const found=t.assigned.find(a=>a.week===w);
      html+=`<td>${found?found.loc:''}</td>`;
    });
    const crowd=t.size?Math.round(t.cap/t.size*100):0;
    html+=`<td>${t.size}</td><td>${t.cap}</td><td>${crowd}%</td></tr>`;
  });

  html+='</table>';
  document.getElementById('output').innerHTML=html;
});
