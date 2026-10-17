Attribute VB_Name = "Form_DatabaseDefaultsFormOLD"
Attribute VB_Base = "0{FCA68ABC-97F2-4904-8F53-F90569742F3F}"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = True
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Attribute VB_TemplateDerived = False
Attribute VB_Customizable = False
Option Compare Database

Private Sub Form_Close()
DoCmd.OpenForm ("navigationform")
End Sub
'------------------------------------------------------------
' CloseButton_Click
'
'------------------------------------------------------------
Private Sub CloseButton_Click()
    DoCmd.Close acForm, ("navigationbackground")

DoCmd.OpenForm "navigationbackground"
    DoCmd.Close acForm, ("databasedefaultsform")

End Sub


