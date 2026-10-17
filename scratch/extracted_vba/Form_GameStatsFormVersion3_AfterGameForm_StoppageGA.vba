Attribute VB_Name = "Form_GameStatsFormVersion3_AfterGameForm_StoppageGA"
Attribute VB_Base = "0{39B49842-1F49-453C-94CA-741F2DA5E6A6}"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = True
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Attribute VB_TemplateDerived = False
Attribute VB_Customizable = False
Option Compare Database

Private Sub ScoredOn_AfterUpdate()
Let [ScoredOnPlayer#] = ScoredOn
If IsNull(GameEventID) Then
GameEventID = strGameEvent
End If

End Sub
