Attribute VB_Name = "Report_SeasonPlusReport"
Attribute VB_Base = "0{CE782E0B-88A6-4437-A693-8CAA27D80F67}"
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
