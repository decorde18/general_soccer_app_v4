Attribute VB_Name = "Form_SeasonStats"
Attribute VB_Base = "0{E4362632-A177-4B4A-A892-C57BA41C0E5C}"
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
