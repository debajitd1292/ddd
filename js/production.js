let productionPlans = [];
let productionTargets = [];


function loadProductionData(productionPlanText, productionTargetText){

    const productionPlanRows = parseCSV(productionPlanText);

    productionPlans = productionPlanRows
        .slice(1)
        .map(r => {

            return {
                from: r[0]?.trim(),
                to: r[1]?.trim(),
                grade: r[2]?.trim()
            };

        })
        .filter(r => r.from && r.to && r.grade);


    const productionTargetRows = parseCSV(productionTargetText);

    productionTargets = productionTargetRows
        .slice(1)
        .map(r => {

            return {
                month: r[0]?.trim(),
                grade: r[1]?.trim(),
                quantity: r[2]?.trim()
            };

        })
        .filter(r => r.month && r.grade && r.quantity);
}


function renderProductionPlan(){

    const title = document.getElementById("productionPlanMonth");
    const targetBox = document.getElementById("productionTargets");
    const body = document.getElementById("productionPlanBody");

    if(!title || !targetBox || !body){
        return;
    }

    const today = new Date();

    const monthName = today.toLocaleString("en-US", {
        month: "long"
    });

    const currentMonth =
        String(today.getMonth() + 1).padStart(2, "0");

    const currentYear =
        today.getFullYear();

    const currentMonthKey =
        currentMonth + "-" + currentYear;


    /* MONTH TITLE */

    title.innerText = monthName + " " + currentYear;


    /* =========================
       PRODUCTION TARGETS
       ========================= */

    const targetOrder = ["WH034", "IH120N", "FH110N"];

    const targets = productionTargets
        .filter(r => r.month === currentMonthKey)
        .sort((a, b) =>
            targetOrder.indexOf(a.grade) - targetOrder.indexOf(b.grade)
        );


    targetBox.innerHTML = "";

    if(targets.length){

        targetBox.innerHTML = targets.map((r, i) => {

            const gradeClass =
                i === 0 ? "grade1" :
                i === 1 ? "grade2" :
                "grade3";

            return `
                <span class="production-target ${gradeClass}">
                    ${r.grade}: ${r.quantity} MT
                </span>
            `;

        }).join("");

    }


    /* =========================
       PRODUCTION PLAN
       ========================= */

    const plans = productionPlans.filter(r => {

        const parts = r.from.split("-");

        if(parts.length !== 3){
            return false;
        }

        const month = parts[1];
        const year = parts[2];

        return month === currentMonth &&
               Number(year) === currentYear;
    });


    body.innerHTML = "";


    if(!plans.length){

        document.getElementById("productionEmpty").style.display = "block";
        document.getElementById("productionTableWrap").style.display = "none";

        body.innerHTML = "";

        return;
    }


    /* =========================
       PLAN ROWS
       ========================= */

    document.getElementById("productionEmpty").style.display = "none";
    document.getElementById("productionTableWrap").style.display = "block";


    plans.forEach(plan => {

        const fromParts =
            plan.from.split("-").map(Number);

        const toParts =
            plan.to.split("-").map(Number);


        const fromDate =
            new Date(
                fromParts[2],
                fromParts[1] - 1,
                fromParts[0]
            );


        const toDate =
            new Date(
                toParts[2],
                toParts[1] - 1,
                toParts[0]
            );


        const days =
            Math.floor(
                (toDate - fromDate) /
                (1000 * 60 * 60 * 24)
            ) + 1;


        const todayDate = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
        );

       const isToday =
            todayDate >= fromDate &&
            todayDate <= toDate;

        const isPast =
            toDate < todayDate;

        const duration =
            fromParts[1] === toParts[1]
                ? `${String(fromParts[0]).padStart(2,"0")}-${String(toParts[0]).padStart(2,"0")} ${fromDate.toLocaleString("en-US",{month:"short"})}`
                : `${String(fromParts[0]).padStart(2,"0")} ${fromDate.toLocaleString("en-US",{month:"short"})}-${String(toParts[0]).padStart(2,"0")} ${toDate.toLocaleString("en-US",{month:"short"})}`;


        const row =
            document.createElement("tr");


        if(isToday){
            row.classList.add("production-today");
        }else if(isPast){
            row.classList.add("production-past");
        }


        row.innerHTML = `
            <td>
                <div class="production-duration">${duration}</div>
            </td>
            <td>
                <div class="production-days">${days}</div>
            </td>
            <td>
                <div class="production-grade">${plan.grade}</div>
            </td>
        `;


        body.appendChild(row);

    });

}

/* ===== CURRENT PRODUCTION GRADE ===== */

function loadProductionGradeData(csvText) {
    const gradeBox = document.getElementById("currentProductionGrade");
    const dateBox = document.getElementById("productionGradeSince");

    if (!gradeBox || !dateBox) return;

    if (!csvText || !csvText.trim()) {
        gradeBox.textContent = "Grade data not available";
        dateBox.textContent = "";
        return;
    }

    const rows = parseCSV(csvText);

    if (!rows || rows.length < 2) {
        gradeBox.textContent = "Grade data not available";
        dateBox.textContent = "";
        return;
    }

    const headers = rows[0].map(v => String(v || "").trim().toLowerCase());

    const gradeIndex = headers.indexOf("grade");
    const dateIndex = headers.indexOf("date");

    if (gradeIndex < 0 || dateIndex < 0) {
        gradeBox.textContent = "Invalid grade CSV format";
        dateBox.textContent = "";
        return;
    }

    function parseGradeDate(value) {
        const text = String(value || "").trim();

        // Supports DD-MMM-YYYY, DD-MM-YYYY and YYYY-MM-DD.
        let match = text.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);

        if (match) {
            const months = {
                jan: 0, feb: 1, mar: 2, apr: 3,
                may: 4, jun: 5, jul: 6, aug: 7,
                sep: 8, oct: 9, nov: 10, dec: 11
            };

            const month = months[match[2].toLowerCase()];
            if (month === undefined) return null;

            const date = new Date(
                Number(match[3]), month, Number(match[1])
            );

            return date.getFullYear() === Number(match[3]) &&
                   date.getMonth() === month &&
                   date.getDate() === Number(match[1])
                ? date
                : null;
        }

        match = text.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);

        if (match) {
            const date = new Date(
                Number(match[3]),
                Number(match[2]) - 1,
                Number(match[1])
            );

            return date.getFullYear() === Number(match[3]) &&
                   date.getMonth() === Number(match[2]) - 1 &&
                   date.getDate() === Number(match[1])
                ? date
                : null;
        }

        match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

        if (match) {
            const date = new Date(
                Number(match[1]),
                Number(match[2]) - 1,
                Number(match[3])
            );

            return date.getFullYear() === Number(match[1]) &&
                   date.getMonth() === Number(match[2]) - 1 &&
                   date.getDate() === Number(match[3])
                ? date
                : null;
        }

        return null;
    }

    const entries = rows.slice(1)
        .map(row => ({
            grade: String(row[gradeIndex] || "").trim(),
            dateText: String(row[dateIndex] || "").trim(),
            date: parseGradeDate(row[dateIndex])
        }))
        .filter(item => item.grade && item.date);

    if (!entries.length) {
        gradeBox.textContent = "Grade data not available";
        dateBox.textContent = "";
        return;
    }

    entries.sort((a, b) => b.date - a.date);

    const latest = entries[0];

    const formattedDate =
        String(latest.date.getDate()).padStart(2, "0") + "-" +
        latest.date.toLocaleString("en-US", { month: "short" }) + "-" +
        latest.date.getFullYear();

    gradeBox.textContent = latest.grade;
    dateBox.textContent = "Current grade since: " + formattedDate;
}