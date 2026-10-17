Attribute VB_Name = "Form_GameStatsFormVersion3_PlayersOnField"
Attribute VB_Base = "0{8896719F-72B2-4158-B2CD-CC9BDAB8E009}"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = True
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Attribute VB_TemplateDerived = False
Attribute VB_Customizable = False
Option Compare Database


Private Sub Form_Timer()
Call UpdateGameMinutes
Me.Refresh
End Sub
