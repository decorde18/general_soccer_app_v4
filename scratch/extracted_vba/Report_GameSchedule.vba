Attribute VB_Name = "Report_GameSchedule"
Attribute VB_Base = "0{66FE9915-B9AD-438F-A802-0FB09F0DDC4D}"
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
