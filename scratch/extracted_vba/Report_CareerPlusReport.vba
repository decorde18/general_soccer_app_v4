Attribute VB_Name = "Report_CareerPlusReport"
Attribute VB_Base = "0{001053AA-2446-4751-869D-30BE3B168C64}"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = True
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Attribute VB_TemplateDerived = False
Attribute VB_Customizable = False
Option Compare Database

Private Sub Report_Close()
strReportPrintButton = 0
Forms!navigationform.PrintReportButton.Enabled = False
End Sub

Private Sub Report_Open(Cancel As Integer)
strReportPrintButton = 1
Let strpubReportName = Me.Name
End Sub
