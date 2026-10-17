Attribute VB_Name = "Form_GameStatsFormVersion3_AfterGameForm_Stoppage"
Attribute VB_Base = "0{26BF3351-D102-45A7-A4B4-FC3CE6F39AAA}"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = True
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Attribute VB_TemplateDerived = False
Attribute VB_Customizable = False
Option Compare Database
Option Explicit

Private Sub Assister_AfterUpdate()
Let [AssistedBy#] = Assister
End Sub

Private Sub Scorer_AfterUpdate()
Let [Scorer#] = Scorer
If IsNull(GameEventID) Then
GameEventID = strGameEvent
End If
End Sub
 
