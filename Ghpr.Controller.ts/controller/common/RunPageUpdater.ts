﻿///<reference path="./../interfaces/IItemInfo.ts"/>
///<reference path="./../interfaces/IReportSettings.ts"/>
///<reference path="./../interfaces/IRun.ts"/>
///<reference path="./../enums/PageType.ts"/>
///<reference path="./JsonLoader.ts"/>
///<reference path="./UrlHelper.ts"/>
///<reference path="./DateFormatter.ts"/>
///<reference path="./Color.ts"/>
///<reference path="./PlotlyJs.ts"/>
///<reference path="./TestRunHelper.ts"/>
///<reference path="./TabsHelper.ts"/>

class RunPageUpdater {

    static currentRunIndex: number;
    static runsToShow: number; 
    static loader = new JsonLoader(PageType.TestRunPage);
    static reportSettings: IReportSettings;

    private static updateCopyright(): void {
        document.getElementById("copyright").innerHTML = `Copyright 2015 - 2017 © GhpReporter (version ${this.reportSettings.coreVersion})`;
    }

    private static updateRunInformation(run: IRun): void {
        document.getElementById("name").innerHTML = `<b>Name:</b> ${run.name}`;
        document.getElementById("sprint").innerHTML = `<b>Sprint:</b> ${run.sprint}`;
        document.getElementById("start").innerHTML = `<b>Start datetime:</b> ${DateFormatter.format(run.runInfo.start)}`;
        document.getElementById("finish").innerHTML = `<b>Finish datetime:</b> ${DateFormatter.format(run.runInfo.finish)}`;
        document.getElementById("duration").innerHTML = `<b>Duration:</b> ${DateFormatter.diff(run.runInfo.start, run.runInfo.finish)}`;
    }

    private static updateTitle(run: IRun): void {
        document.getElementById("page-title").innerHTML = run.name;
    }

    private static updateSummary(run: IRun): void {
        const s = run.summary;
        document.getElementById("total").innerHTML = `<b>Total:</b> ${s.total}`;
        document.getElementById("passed").innerHTML = `<b>Success:</b> ${s.success}`;
        document.getElementById("broken").innerHTML = `<b>Errors:</b> ${s.errors}`;
        document.getElementById("failed").innerHTML = `<b>Failures:</b> ${s.failures}`;
        document.getElementById("inconclusive").innerHTML = `<b>Inconclusive:</b> ${s.inconclusive}`;
        document.getElementById("ignored").innerHTML = `<b>Ignored:</b> ${s.ignored}`;
        document.getElementById("unknown").innerHTML = `<b>Unknown:</b> ${s.unknown}`;
        
        const pieDiv = document.getElementById("summary-pie");
        Plotly.newPlot(pieDiv,
        [
            {
                values: [s.success, s.errors, s.failures, s.inconclusive, s.ignored, s.unknown],
                labels: ["Passed", "Broken", "Failed", "Inconclusive", "Ignored", "Unknown"],
                marker: {
                    colors: [
                        Color.passed, Color.broken, Color.failed, Color.inconclusive, Color.ignored, Color.unknown],
                    line: {
                        color: "white",
                        width: 2
                    }
                },
                outsidetextfont: {
                    family: "Helvetica, arial, sans-serif"
                },
                textfont: {
                    family: "Helvetica, arial, sans-serif"
                },
                textinfo: "label+percent",
                type: "pie",
                hole: 0.35
            }
        ],
        {
            margin: { t: 0 }
        });
    }

    private static setTestsList(tests: Array<ITestRun>): void {
        let list = "";
        const c = tests.length;
        for (let i = 0; i < c; i++) {
            const t = tests[i];
            list += `<li id=$test-${t.testInfo.guid}>Test #${c - i - 1}: <a href="./../tests/index.html?testGuid=${t.testInfo.guid}&testFile=${t.testInfo.fileName}">${t.name}</a></li>`;
        }
        document.getElementById("all-tests").innerHTML = list;
    }

    private static addTest(t: ITestRun, c: number, i: number): void {
        //console.log(`adding ${i} of ${c}`);
        const ti = t.testInfo;
        const testHref = `./../tests/index.html?testGuid=${ti.guid}&testFile=${ti.fileName}`;
        const testLi = `<li id="test-${ti.guid}" style="list-style-type: none;" class="${TestRunHelper.getResult(t)}">
            <span class="octicon octicon-primitive-square" style="color: ${TestRunHelper.getColor(t)};"></span>
            <a href="${testHref}"> ${t.name}</a></li>`;
        //getting correct namespace to build hierarchical test list
        const nameIndex = t.fullName.lastIndexOf(t.name);
        let nameRemoved = false;
        let fn = t.fullName;
        if (t.fullName.indexOf(t.name) > 0) {
            fn = t.fullName.substring(0, nameIndex);
            nameRemoved = true;
        }
        if (fn.slice(-1) === ".") {
            fn = fn.slice(0, -1);
        }
        const arr = fn.split(".");
        const len1 = arr.length;
        //remove all special symbols:
        for (let j = arr.length - 1; j >= 0; j -= 1) {
            if (/[~`!#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g.test(arr[j])) {
                arr.splice(j, 1);
            }
        }
        //remove name from fullName if it was not removed:
        let len2 = arr.length;
        if ((len1 === len2) && !nameRemoved) {
            arr.splice(len2 - 1, 1);
            len2 = arr.length;
        }
        const ids: string[] = new Array();
        for (let j = 0; j < len2; j++) {
            ids[j] = `id-${arr.slice(0, j + 1).join(".").replace(/\s/g, "_")}`;
        }
        for (let j = 0; j <= len2; j++) {
            const el = document.getElementById(ids[j]);
            if (el === null || el === undefined) {
                const li = `<li id="${ids[j]}" class="test-suite"><a>${arr[j]}</a><ul></ul></li>`;
                if (j === 0) {
                    document.getElementById("all-tests").innerHTML += li;
                } else {
                    if (j !== len2) {
                        document.getElementById(ids[j - 1]).getElementsByTagName("ul")[0].innerHTML += li;
                    } else {
                        document.getElementById(ids[j - 1]).getElementsByTagName("ul")[0].innerHTML += testLi;
                    }
                }
            }
        }
        //make sure all tests are displayed with respect to filter buttons:
        const btns = document.getElementById("test-result-filter-buttons").getElementsByTagName("button");
        for (let i = 0; i < btns.length; i++) {
            const btn = btns[i];
            const id = btn.getAttribute("id");
            const tests = document.getElementsByClassName(id);
            btn.style.backgroundImage = "none";
            btn.style.backgroundColor = TestRunHelper.getColorByResult(Number(id));
            for (let j = 0; j < tests.length; j++) {
                const t = tests[j] as HTMLElement;
                if (!btn.classList.contains("disabled")) {
                    t.style.display = "";
                } else {
                    t.style.display = "none";    
                }
            }
        }
    }
    
    private static makeCollapsible(): void {
        const targets = document.getElementsByClassName("test-suite");
        for (let i = 0; i < targets.length; i++) {
            const t = targets[i];
            t.getElementsByTagName("a")[0].onclick = () => {
                const e = t.getElementsByTagName("ul")[0];
                if (e.style.display === "") {
                    e.style.display = "none";
                } else {
                    e.style.display = "";
                }
            };
        }
    }

    private static updateTestFilterButtons(): void {
        const btns = document.getElementById("test-result-filter-buttons").getElementsByTagName("button");
        for (let i = 0; i < btns.length; i++) {
            const btn = btns[i];
            const id = btn.getAttribute("id");
            const tests = document.getElementsByClassName(id);
            btn.style.backgroundImage = "none";
            btn.style.backgroundColor = TestRunHelper.getColorByResult(Number(id));
            btn.onclick = () => {
                if (!btn.classList.contains("disabled")) {
                    btn.classList.add("disabled");
                    for (let j = 0; j < tests.length; j++) {
                        const t = tests[j] as HTMLElement;
                        t.style.display = "none";
                    }
                } else {
                    btn.classList.remove("disabled");
                    for (let j = 0; j < tests.length; j++) {
                        const t = tests[j] as HTMLElement;
                        t.style.display = "";
                    }
                }
            };
        }
    }
    
    private static updateRunPage(runGuid: string): IRun {
        let run: IRun;
        this.loader.loadRunJson(runGuid, (response: string) => {
            run = JSON.parse(response, JsonLoader.reviveRun);
            if (run.name === "") {
                run.name = `${DateFormatter.format(run.runInfo.start)} - ${DateFormatter.format(run.runInfo.finish)}`;
            }
            UrlHelper.insertParam("runGuid", run.runInfo.guid);
            this.updateRunInformation(run);
            this.updateSummary(run);
            this.updateTitle(run);
            this.updateTestFilterButtons();
            this.updateTestsList(run);
            this.updateCopyright();
        });
        return run;
    }

    static updateTestsList(run: IRun): void {
        const paths: Array<string> = new Array();
        var test: ITestRun;
        document.getElementById("btn-back").setAttribute("href", `./../index.html`);
        document.getElementById("all-tests").innerHTML = "";
        const files = run.testRunFiles;
        for (let i = 0; i < files.length; i++) {
            paths[i] = `./../tests/${files[i]}`;
        }
        var index = 0;
        this.loader.loadJsons(paths, 0, (response: string, c: number, i: number) => {
            test = JSON.parse(response, JsonLoader.reviveRun);
            this.addTest(test, c, i);
            if(i === c - 1) this.makeCollapsible();
            index++;
        });
    }
    
    private static loadRun(index: number): void {
        let runInfos: Array<IItemInfo>;
        this.loader.loadRunsJson((response: string) => {
            runInfos = JSON.parse(response, JsonLoader.reviveRun);
            runInfos.sort(Sorter.itemInfoSorterByFinishDateFuncDesc);
            this.runsToShow = this.reportSettings.runsToDisplay >= 1 ? Math.min(runInfos.length, this.reportSettings.runsToDisplay) : runInfos.length;
            if (index === undefined || index.toString() === "NaN") {
                index = 0;
            }
            if (index === 0) {
                this.disableBtn("btn-next");
            }
            if (index === this.runsToShow - 1) {
                this.disableBtn("btn-prev");
            }
            this.currentRunIndex = index;
            this.updateRunPage(runInfos[index].guid);
        });
    }

    private static tryLoadRunByGuid(): void {
        const guid = UrlHelper.getParam("runGuid");
        if (guid === "") {
            this.loadRun(undefined);
            return;
        }
        let runInfos: Array<IItemInfo>;
        this.loader.loadRunsJson((response: string) => {
            runInfos = JSON.parse(response, JsonLoader.reviveRun);
            runInfos.sort(Sorter.itemInfoSorterByFinishDateFuncDesc);
            this.runsToShow = this.reportSettings.runsToDisplay >= 1 ? Math.min(runInfos.length, this.reportSettings.runsToDisplay) : runInfos.length;
            const runInfo = runInfos.find((r) => r.guid === guid);
            if (runInfo != undefined) {
                this.enableBtns();
                let index = runInfos.indexOf(runInfo);
                if (index === 0) {
                    this.disableBtn("btn-next");
                }
                if (index >= this.runsToShow - 1) {
                    index = this.runsToShow - 1;
                    this.disableBtn("btn-prev");
                }
                this.loadRun(index);
            } else {
                this.loadRun(undefined);
            }
        });
    }

    private static enableBtns(): void {
        document.getElementById("btn-prev").removeAttribute("disabled");
        document.getElementById("btn-next").removeAttribute("disabled");
    }

    private static disableBtn(id: string): void {
        document.getElementById(id).setAttribute("disabled", "true");
    }

    static loadPrev(): void {
        if (this.currentRunIndex === this.runsToShow - 1) {
            this.disableBtn("btn-prev");
            return;
        }
        else {
            this.enableBtns();
            this.currentRunIndex += 1;
            if (this.currentRunIndex >= this.runsToShow - 1) {
                this.currentRunIndex = this.runsToShow - 1;
                this.disableBtn("btn-prev");
            }
            this.loadRun(this.currentRunIndex);
        }
    }

    static loadNext(): void {
        if (this.currentRunIndex === 0) {
            this.disableBtn("btn-next");
            return;
        } else {
            this.enableBtns();
            this.currentRunIndex -= 1;
            if (this.currentRunIndex <= 0) {
                this.currentRunIndex = 0;
                this.disableBtn("btn-next");
            }
            this.loadRun(this.currentRunIndex);
        }
    }

    static loadLatest(): void {
        this.enableBtns();
        this.disableBtn("btn-next");
        this.loadRun(undefined);
    }

    static initializePage(): void {
        this.loader.loadReportSettingsJson((response: string) => {
            this.reportSettings = JSON.parse(response);
            const isLatest = UrlHelper.getParam("loadLatest");
            if (isLatest !== "true") {
                UrlHelper.removeParam("loadLatest");
                this.tryLoadRunByGuid();
            } else {
                UrlHelper.removeParam("loadLatest");
                this.loadLatest();
            }
        });
        const tabFromUrl = UrlHelper.getParam("currentTab");
        const tab = tabFromUrl === "" ? "run-main-stats" : tabFromUrl;
        this.showTab(tab, document.getElementById(`tab-${tab}`));
    }

    private static runPageTabsIds: Array<string> = ["run-main-stats", "run-test-list"];

    static showTab(idToShow: string, caller: HTMLElement): void {
        TabsHelper.showTab(idToShow, caller, this.runPageTabsIds);
    }
}