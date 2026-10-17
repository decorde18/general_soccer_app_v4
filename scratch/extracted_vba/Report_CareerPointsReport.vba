Attribute VB_Name = "Report_CareerPointsReport"
Attribute VB_Base = "0{FD1778BB-2D17-4126-AD02-CD3070316441}"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = True
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Attribute VB_TemplateDerived = False
Attribute VB_Customizable = False
Option Compare Database

Private Sub Report_Close()
strReportPrintButton = 0
End Sub

Private Sub Report_Open(Cancel As Integer)
strReportPrintButton = 1
Let strpubReportName = Me.Name
End Sub
