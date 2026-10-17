Attribute VB_Name = "Form_CareerStats"
Attribute VB_Base = "0{9C43DD7B-FCC6-4C68-A05C-C46E3033B472}"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = True
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Attribute VB_TemplateDerived = False
Attribute VB_Customizable = False
Option Compare Database

Private Sub Form_Close()
DoCmd.SetWarnings True
End Sub

Private Sub Form_Load()
DoCmd.SetWarnings False
End Sub
