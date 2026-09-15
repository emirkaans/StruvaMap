package com.struva.map.ui.solve

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.struva.map.ui.common.ScoreResultView
import com.struva.map.ui.common.StruvaButton
import com.struva.map.ui.theme.EyebrowStyle
import com.struva.map.ui.theme.StruvaColors
import com.struva.map.ui.theme.struvaTopAppBarColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SolveScreen(
    onFinished: () -> Unit,
    onOpenComparison: (String) -> Unit,
    viewModel: SolveViewModel = hiltViewModel(),
) {
    val state by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = { TopAppBar(title = { Text("Test") }, colors = struvaTopAppBarColors()) },
    ) { padding ->
        Box(
            modifier = Modifier.fillMaxSize().padding(padding),
            contentAlignment = Alignment.Center,
        ) {
            when (val s = state) {
                is SolveUiState.Loading, is SolveUiState.Submitting -> CircularProgressIndicator()

                is SolveUiState.Error -> Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(s.message)
                    Spacer(Modifier.height(12.dp))
                    StruvaButton(onClick = viewModel::load) { Text("Tekrar dene") }
                }

                is SolveUiState.ContextQuestion -> Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
                    Text("Ek soru ${s.position + 1} / ${s.total}", style = EyebrowStyle)
                    Spacer(Modifier.height(16.dp))
                    Text(s.question.text, style = MaterialTheme.typography.headlineSmall)
                    Spacer(Modifier.height(24.dp))
                    s.question.options.forEach { opt ->
                        OutlinedButton(
                            onClick = { viewModel.chooseContextAnswer(s.question.id, opt.value) },
                            modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                            shape = RoundedCornerShape(10.dp),
                            border = BorderStroke(1.dp, StruvaColors.Border),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = StruvaColors.Text),
                        ) { Text(opt.label) }
                    }
                }

                is SolveUiState.Question -> Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
                    Text("Soru ${s.position + 1} / ${s.total}", style = EyebrowStyle)
                    Spacer(Modifier.height(16.dp))
                    Text(s.question.text, style = MaterialTheme.typography.headlineSmall)
                    Spacer(Modifier.height(24.dp))
                    s.question.options.forEachIndexed { idx, opt ->
                        OutlinedButton(
                            onClick = { viewModel.chooseAnswer(s.question.id, idx) },
                            modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
                            shape = RoundedCornerShape(10.dp),
                            border = BorderStroke(1.dp, StruvaColors.Border),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = StruvaColors.Text),
                        ) { Text(opt.label) }
                    }
                }

                is SolveUiState.Result -> ScoreResultView(
                    s.score,
                    resultId = s.resultId,
                    onOpenComparison = onOpenComparison,
                    onDone = onFinished,
                )
            }
        }
    }
}
