Attribute VB_Name = "Report_GameSummaryReportGameFinal"
Attribute VB_Base = "0{3BA97C3F-0440-44D2-B410-2818E508509E}"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = True
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Attribute VB_TemplateDerived = False
Attribute VB_Customizable = False
Option Compare Database

Private Sub Report_Close()
Forms!navigationform.PrintReportButton.Enabled = False
End Sub

Private Sub Report_Open(Cancel As Integer)
Forms!navigationform.PrintReportButton.Enabled = True
Let strpubReportName = Me.Name
End Sub
