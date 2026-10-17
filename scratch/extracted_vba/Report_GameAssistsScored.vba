Attribute VB_Name = "Report_GameAssistsScored"
Attribute VB_Base = "0{D09EF549-C7AF-4E44-8B88-1805E0225433}"
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
