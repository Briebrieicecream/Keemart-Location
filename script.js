/* -------- Location 表 -------- */
const locHot = new Handsontable(document.getElementById("locTable"), {
  data: [[]],
  colHeaders: [
    "Station",
    "Location Code",
    "Sun-Wed BD",
    "Thu-Sat BD",
    "Security Index",
    "Max BD",
  ],
  rowHeaders: true,
  minRows: 15,
  stretchH: "all",
  licenseKey: "non-commercial-and-evaluation",
  // 只允许在 Location 表粘贴
  afterPaste: () => teamHot.loadData([["", ""]]),
});

/* -------- Team 表 -------- */
const teamHot = new Handsontable(document.getElementById("teamTable"), {
  data: [["", ""]],
  colHeaders: ["BDM", "Team Size"],
  rowHeaders: true,
  minRows: 10,
  stretchH: "all",
  licenseKey: "non-commercial-and-evaluation",
  // 禁掉 Team 表的 Ctrl+V，避免误贴
  copyPaste: false,
});

/* -------- 生成排班按钮 -------- */
document.getElementById("genBtn").addEventListener("click", () => {
  const locData = locHot
    .getData()
    .filter((r) => r.some((c) => c !== null && c !== ""));
  const teamData = teamHot
    .getData()
    .filter((r) => r.some((c) => c !== null && c !== ""));
  if (!locData.length || !teamData.length) {
    alert("请粘贴完整两张表后再生成！");
    return;
  }
  /* …后面排班逻辑保持不变… */
});
