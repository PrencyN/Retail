from __future__ import annotations

from pathlib import Path

from openpyxl import Workbook, load_workbook
from openpyxl.formatting.rule import CellIsRule
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.worksheet.table import Table, TableStyleInfo

from models import Risk


HEADERS = [
    "Risk ID", "Fingerprint", "Status", "Component", "Service", "Source File",
    "Source Line", "Evidence", "Scanner", "Scanner Rule", "STRIDE Category", "CWE",
    "OWASP Category", "Threat Scenario", "Attack Path", "Existing Controls",
    "Recommended Mitigation", "Likelihood", "Impact", "Risk Score", "Severity",
    "Confidence", "Owner", "Target Date", "Detected Commit", "First Detected",
    "Last Detected", "Resolution", "Reviewer Comments", "Accepted Risk Reason",
    "Missing Scan Count",
]

PRESERVED = {
    "Status", "Owner", "Target Date", "Resolution", "Reviewer Comments",
    "Accepted Risk Reason",
}

SEVERITY_RANK = {"Low": 1, "Medium": 2, "High": 3, "Critical": 4}

COLUMN_WIDTHS = {
    "A": 13, "B": 18, "C": 20, "D": 28, "E": 24, "F": 45, "G": 12,
    "H": 55, "I": 22, "J": 24, "K": 24, "L": 16, "M": 18, "N": 60,
    "O": 60, "P": 60, "Q": 60, "R": 12, "S": 10, "T": 12, "U": 14,
    "V": 14, "W": 22, "X": 16, "Y": 18, "Z": 24, "AA": 24, "AB": 40,
    "AC": 45, "AD": 45, "AE": 18,
}


def _book(path: Path):
    if path.exists():
        workbook = load_workbook(path)
        worksheet = workbook["Risk Register"]
        return workbook, worksheet

    workbook = Workbook()
    worksheet = workbook.active
    worksheet.title = "Risk Register"
    worksheet.append(HEADERS)
    return workbook, worksheet


def _style(worksheet) -> None:
    for cell in worksheet[1]:
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = PatternFill("solid", fgColor="1F4E78")
        cell.alignment = Alignment(vertical="center", wrap_text=True)

    worksheet.freeze_panes = "A2"
    worksheet.auto_filter.ref = f"A1:AE{max(1, worksheet.max_row)}"
    worksheet.row_dimensions[1].height = 32

    for column, width in COLUMN_WIDTHS.items():
        worksheet.column_dimensions[column].width = width

    for row in worksheet.iter_rows(min_row=2):
        for cell in row:
            cell.alignment = Alignment(vertical="top", wrap_text=True)

    if worksheet.max_row >= 2:
        worksheet.conditional_formatting.add(
            f"T2:T{worksheet.max_row}",
            CellIsRule(operator="greaterThanOrEqual", formula=["20"],
                       fill=PatternFill("solid", fgColor="F4CCCC")),
        )
        worksheet.conditional_formatting.add(
            f"T2:T{worksheet.max_row}",
            CellIsRule(operator="between", formula=["12", "19"],
                       fill=PatternFill("solid", fgColor="FCE5CD")),
        )
        worksheet.conditional_formatting.add(
            f"T2:T{worksheet.max_row}",
            CellIsRule(operator="between", formula=["6", "11"],
                       fill=PatternFill("solid", fgColor="FFF2CC")),
        )


def update(path: Path, risks: list[Risk], missing_threshold: int) -> dict:
    path.parent.mkdir(parents=True, exist_ok=True)
    workbook, worksheet = _book(path)
    header = {cell.value: index for index, cell in enumerate(worksheet[1], start=1)}

    missing_headers = [name for name in HEADERS if name not in header]
    if missing_headers:
        raise ValueError("Workbook is missing expected columns: " + ", ".join(missing_headers))

    existing: dict[str, int] = {}
    max_id = 0
    for row_number in range(2, worksheet.max_row + 1):
        fingerprint = worksheet.cell(row_number, header["Fingerprint"]).value
        if fingerprint:
            existing[str(fingerprint)] = row_number
        risk_id = str(worksheet.cell(row_number, header["Risk ID"]).value or "")
        if risk_id.startswith("TM-") and risk_id[3:].isdigit():
            max_id = max(max_id, int(risk_id[3:]))

    seen: set[str] = set()
    new_critical: list[str] = []
    severity_increased: list[str] = []

    for risk in risks:
        seen.add(risk.fingerprint)
        row_number = existing.get(risk.fingerprint)
        is_existing = row_number is not None
        old_severity = None

        if is_existing:
            assert row_number is not None
            old_severity = worksheet.cell(row_number, header["Severity"]).value
            risk.risk_id = str(worksheet.cell(row_number, header["Risk ID"]).value)
            risk.first_detected = str(
                worksheet.cell(row_number, header["First Detected"]).value
                or risk.first_detected
            )
        else:
            max_id += 1
            risk.risk_id = f"TM-{max_id:04d}"
            worksheet.append([""] * len(HEADERS))
            row_number = worksheet.max_row
            existing[risk.fingerprint] = row_number
            if risk.severity == "Critical":
                new_critical.append(risk.risk_id)

        values = {
            "Risk ID": risk.risk_id,
            "Fingerprint": risk.fingerprint,
            "Status": risk.status,
            "Component": risk.component,
            "Service": risk.service,
            "Source File": risk.source_file,
            "Source Line": risk.source_line,
            "Evidence": risk.evidence,
            "Scanner": risk.scanner,
            "Scanner Rule": risk.scanner_rule,
            "STRIDE Category": risk.stride_category,
            "CWE": risk.cwe,
            "OWASP Category": risk.owasp_category,
            "Threat Scenario": risk.threat_scenario,
            "Attack Path": risk.attack_path,
            "Existing Controls": risk.existing_controls,
            "Recommended Mitigation": risk.recommended_mitigation,
            "Likelihood": risk.likelihood,
            "Impact": risk.impact,
            "Risk Score": risk.risk_score,
            "Severity": risk.severity,
            "Confidence": risk.confidence,
            "Owner": risk.owner,
            "Target Date": risk.target_date,
            "Detected Commit": risk.detected_commit,
            "First Detected": risk.first_detected,
            "Last Detected": risk.last_detected,
            "Resolution": risk.resolution,
            "Reviewer Comments": risk.reviewer_comments,
            "Accepted Risk Reason": risk.accepted_risk_reason,
            "Missing Scan Count": 0,
        }

        for name, value in values.items():
            current = worksheet.cell(row_number, header[name]).value
            if is_existing and name in PRESERVED and current not in (None, ""):
                continue
            worksheet.cell(row_number, header[name]).value = value

        if old_severity and SEVERITY_RANK.get(risk.severity, 0) > SEVERITY_RANK.get(str(old_severity), 0):
            severity_increased.append(risk.risk_id)
            for cell in worksheet[row_number]:
                cell.fill = PatternFill("solid", fgColor="F4CCCC")

    for fingerprint, row_number in existing.items():
        if fingerprint in seen:
            continue
        count_cell = worksheet.cell(row_number, header["Missing Scan Count"])
        count = int(count_cell.value or 0) + 1
        count_cell.value = count
        status_cell = worksheet.cell(row_number, header["Status"])
        if status_cell.value not in {"Accepted", "Closed"}:
            status_cell.value = (
                "Resolved Candidate" if count >= missing_threshold
                else "Pending Verification"
            )

    if worksheet.max_row >= 2 and "RiskTable" not in worksheet.tables:
        table = Table(displayName="RiskTable", ref=f"A1:AE{worksheet.max_row}")
        table.tableStyleInfo = TableStyleInfo(
            name="TableStyleMedium2",
            showRowStripes=True,
            showColumnStripes=False,
        )
        worksheet.add_table(table)
    elif "RiskTable" in worksheet.tables:
        worksheet.tables["RiskTable"].ref = f"A1:AE{worksheet.max_row}"

    _style(worksheet)
    workbook.save(path)

    return {
        "newCritical": new_critical,
        "severityIncreased": severity_increased,
        "totalActive": len(risks),
    }
