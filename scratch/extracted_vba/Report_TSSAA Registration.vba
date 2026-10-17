Attribute VB_Name = "Report_TSSAA Registration"
Attribute VB_Base = "0{C4371E49-0790-4AA0-8234-1CB7B039CC36}"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = True
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Attribute VB_TemplateDerived = False
Attribute VB_Customizable = False
Option Compare Database
Option Explicit

Private Sub Report_Close()
'Forms!navigationform.PrintReportButton.Enabled = False
End Sub

Private Sub Report_Open(Cancel As Integer)
'Forms!navigationform.PrintReportButton.Enabled = True
Let strpubReportName = Me.Name
End Sub



