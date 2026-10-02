import { describe, expect, it } from "vitest";

import { buildContext } from "@/lib/scoring/context";
import { scoreParseability } from "@/lib/scoring/parseability";

import { STRONG_CV } from "./fixtures";

/**
 * A subsetted or mis-decoded font maps glyphs onto code points the CV never
 * meant. When most letters fall outside the Latin blocks a European CV is
 * written in, the text layer is broken even though no U+FFFD is in sight.
 */

function idsOf(cv: string): string[] {
  return scoreParseability(buildContext(cv)).findings.map((finding) => finding.id);
}

const GARBLED_CV = `Curriculum Vitae 简历 概要 工程师 经验 自动化 测试 平台 团队 项目 系统 分析 设计
工作经历 高级工程师 质量 保证 部门 负责 回归 测试 套件 开发 与 维护 工作
教育 背景 计算机 工程 学士 学位 毕业 于 伊斯坦布尔 技术 大学
技能 编程 语言 框架 工具 数据库 云 服务 容器 编排 持续 集成 部署
Jane Doe jan@example.com Berlin experience automation testing platform summary`;

const LATIN_CV = `Jane Doe

Für die Qualitätssicherung in München: Größe, Straße, Ärger, prüfen,äß.

Experience

İstanbul Teknik Üniversitesi mezunu, Şubat ve Ağustos aylarında,
öğrenim boyunca Türkçe ve İngilizce projelerde çalıştım, geliştim.
- Automated the regression suite with Playwright across products.
- Reduced release verification time and improved the coverage greatly.
`;

describe("parse.garbled-text", () => {
  it("fires when most letters sit outside the Latin blocks", () => {
    expect(idsOf(GARBLED_CV)).toContain("parse.garbled-text");
  });

  it("keeps German umlauts and sharp s safe", () => {
    expect(idsOf(LATIN_CV)).not.toContain("parse.garbled-text");
  });

  it("keeps Turkish dotted and cedilla letters safe", () => {
    expect(idsOf(STRONG_CV)).not.toContain("parse.garbled-text");
    expect(idsOf(LATIN_CV)).not.toContain("parse.garbled-text");
  });
});
