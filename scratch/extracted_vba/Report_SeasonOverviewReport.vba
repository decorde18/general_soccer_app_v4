Attribute VB_Name = "Report_SeasonOverviewReport"
Attribute VB_Base = "0{32F6D92E-70EE-48C6-8186-CD3F683D1789}"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = True
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Attribute VB_TemplateDerived = False
Attribute VB_Customizable = False
Option Compare Database

Private Sub Report_Close()
Let strReportPrintButton = 0
End Sub

Private Sub Report_Open(Cancel As Integer)
Let strReportPrintButton = 1
Let strpubReportName = Me.Name
End Sub
