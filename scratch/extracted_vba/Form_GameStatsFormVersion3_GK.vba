Attribute VB_Name = "Form_GameStatsFormVersion3_GK"
Attribute VB_Base = "0{192F4270-A218-42F0-8304-81975EB76AB0}"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = True
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Attribute VB_TemplateDerived = False
Attribute VB_Customizable = False
Option Compare Database

Private Sub Form_Timer()
Me!Minutes.Requery
End Sub
